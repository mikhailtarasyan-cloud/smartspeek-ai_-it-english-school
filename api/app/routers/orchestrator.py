from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import OrchestratorLog
from app.schemas import OrchestratorRequest, OrchestratorResponse
from app.agents.guard import input_check, output_check
from app.agents.router import select_agent
from app.agents import tutor, buddy, assessor, planner

router = APIRouter()


@router.post("/orchestrator/message", response_model=OrchestratorResponse)
def orchestrator_message(payload: OrchestratorRequest, db: Session = Depends(get_db)):
    input_result = input_check(payload.last_user_message)
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

    output_result = output_check(response)
    response = output_result["response"]

    risk_flags = list(set(input_result["risk"]["flags"] + output_result["risk"]["flags"]))
    response["telemetry"]["risk"] = {
        "blocked": input_result["risk"]["blocked"] or output_result["risk"]["blocked"],
        "level": "high" if input_result["risk"]["level"] == "high" else output_result["risk"]["level"],
        "flags": risk_flags,
        "notes": input_result["risk"]["notes"] or output_result["risk"]["notes"],
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
