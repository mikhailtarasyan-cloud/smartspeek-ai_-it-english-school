from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import OrchestratorLog
from app.schemas import OrchestratorRequest, OrchestratorResponse
from app.guard.guard_v2 import input_check_v2, output_check_v2
from app.agents.router import select_agent
from app.agents import tutor, buddy, assessor, planner

router = APIRouter()


@router.post("/orchestrator/message", response_model=OrchestratorResponse)
def orchestrator_message(payload: OrchestratorRequest, db: Session = Depends(get_db)):
    # Get context messages for multi-turn analysis
    context_messages = None
    if payload.context and isinstance(payload.context.get("recent_messages"), list):
        context_messages = payload.context["recent_messages"]
    
    # Enhanced input guard v2
    input_result = input_check_v2(payload.last_user_message, context_messages=context_messages)
    
    # Safe mode: force TutorAgent or BuddyAgent
    if input_result["mode"] == "safe":
        # In safe mode, use TutorAgent for educational content only
        agent_name = "TutorAgent"
        ctx = payload.context.copy() if payload.context else {}
        ctx["safety_mode"] = True
    else:
        # Normal routing
        agent_name, ctx = select_agent(
            input_result["sanitized_user_message"],
            payload.fsm_state,
            payload.context or {},
            input_result["risk"]["level"],
        )

    ctx.update(
        {
            "last_user_message": input_result["sanitized_user_message"],
            "fsm_state": payload.fsm_state,
            "locale": payload.locale,
        }
    )

    # Generate response
    if input_result["risk"]["blocked"]:
        response = buddy.respond(payload.locale, ctx)
        response["telemetry"]["risk"] = input_result["risk"]
        response["handoff"]["to_agent"] = "BuddyAgent"
    else:
        if agent_name == "TutorAgent":
            response = tutor.respond(payload.locale, ctx)
        elif agent_name == "BuddyAgent":
            response = buddy.respond(payload.locale, ctx)
        elif agent_name == "PlannerAgent":
            response = planner.respond(payload.locale, ctx)
        else:
            assessor_response = assessor.respond(payload.locale, ctx)
            tutor_response = tutor.respond(payload.locale, ctx)
            tutor_response["telemetry"]["events"].extend(assessor_response["telemetry"].get("events", []))
            response = tutor_response

    # Enhanced output guard v2
    output_result = output_check_v2(response)
    
    # If output was blocked, use fallback
    if not output_result["accepted"]:
        response = output_result["response"]
    else:
        response = output_result["response"]

    # Aggregate risk from input and output
    input_risk = input_result["risk"]
    output_risk = output_result["risk"]
    
    # Combine flags
    risk_flags = list(set(input_risk.get("flags", []) + output_risk.get("flags", [])))
    
    # Determine final level (max of both)
    level_map = {"low": 0, "medium": 1, "high": 2}
    final_level = max(
        input_risk.get("level", "low"),
        output_risk.get("level", "low"),
        key=lambda x: level_map.get(x, 0)
    )
    
    # Final score (max of both)
    final_score = max(
        input_risk.get("score", 0.0),
        output_risk.get("score", 0.0)
    )
    
    # Blocked if either is blocked
    final_blocked = input_risk.get("blocked", False) or output_risk.get("blocked", False)
    
    # Combine notes
    notes_parts = []
    if input_risk.get("notes"):
        notes_parts.append(f"Input: {input_risk['notes']}")
    if output_risk.get("notes"):
        notes_parts.append(f"Output: {output_risk['notes']}")
    final_notes = " | ".join(notes_parts) if notes_parts else ""
    
    # Update response telemetry
    response["telemetry"]["risk"] = {
        "blocked": final_blocked,
        "level": final_level,
        "score": final_score,
        "flags": risk_flags,
        "notes": final_notes,
    }

    db.add(
        OrchestratorLog(
            id=str(uuid4()),
            user_id=payload.user_id,
            input_json={"message": payload.last_user_message},
            output_json=response,
            risk_json=response["telemetry"]["risk"],
        )
    )
    db.commit()

    return response
