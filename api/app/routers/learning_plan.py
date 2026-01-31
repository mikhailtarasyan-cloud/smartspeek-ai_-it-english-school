import json
from datetime import datetime
from typing import Any
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models import LearningPlan, LearningPlanLesson, User
from app.schemas import (
    LearningPlanCurrentResponse,
    LearningPlanGenerateRequest,
    LearningPlanGenerateResponse,
    LearningPlanLessonResponse,
    LearningPlanLessonShort,
    LearningPlanProgress,
)
from app.security import get_current_user

router = APIRouter()

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
DEFAULT_MODEL = "gemini-2.5-flash"

SYSTEM_PROMPT = (
    "You are LEARNING PLAN GENERATOR for \"SmartSpeek AI\".\n"
    "Generate a PERSONAL STUDY PLAN called \"Учебный план\" with EXACTLY 7 or 21 lessons (plan_length).\n"
    "The plan must match the user's CEFR level (A1–C1) and goals.\n"
    "Output VALID JSON ONLY.\n\n"
    "Rules:\n"
    "- Each lesson: title, goals, focus_terms, and 3–6 interactive activities.\n"
    "- Activities must be level-appropriate.\n"
    "- Explanations must be short, Simple English.\n"
    "- Keep lessons practical for IT/AI workplace communication.\n"
    "- Avoid repetition across lessons (terms, sentence patterns, contexts).\n"
    "- No secrets, no credentials, no policy bypass content.\n\n"
    "Return schema:\n"
    "{\n"
    "  \"cefr_level\": \"...\",\n"
    "  \"plan_length\": 7|21,\n"
    "  \"persona\": {...},\n"
    "  \"plan_summary\": \"...\",\n"
    "  \"lessons\": [ ... ]\n"
    "}\n"
)


def _call_gemini(payload: dict[str, Any]) -> dict[str, Any]:
    if not settings.llm_api_key:
        raise HTTPException(
            status_code=500,
            detail="LLM provider is not available. Please contact support."
        )
    url = GEMINI_API_URL.format(model=DEFAULT_MODEL)
    with httpx.Client(timeout=30) as client:
        resp = client.post(url, params={"key": settings.llm_api_key}, json=payload)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="LLM provider error. Please try again later.")
    return resp.json()


def _extract_json_from_text(text: str) -> dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON block
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


def _activities_for_level(cefr_level: str, term: str, context: str) -> list[dict[str, Any]]:
    base = [
        {
            "type": "mcq",
            "prompt": f"What does '{term}' mean in {context}?",
            "options": [
                f"A common {context} term used in updates",
                "A type of database",
                "A design pattern",
                "A testing framework",
            ],
            "answer_key": 0,
            "explanation_simple": f"'{term}' is a practical term for {context} updates.",
        }
    ]

    if cefr_level in {"A1", "A2"}:
        base.append(
            {
                "type": "fill_gap",
                "prompt": f"We ___ the {term} today.",
                "answer_key": "use",
                "explanation_simple": "Use a simple verb to complete the sentence.",
            }
        )
        base.append(
            {
                "type": "true_false",
                "prompt": f"'{term}' is often used in daily standup updates.",
                "answer_key": True,
                "explanation_simple": "It appears in short work updates.",
            }
        )
        return base[:3]

    if cefr_level in {"B1", "B2"}:
        base.append(
            {
                "type": "choose_best_phrase",
                "prompt": "Choose the best work update:",
                "options": [
                    f"We will {term} after the meeting.",
                    f"I {term} yesterday and it failed.",
                    f"The {term} is ready for review.",
                ],
                "answer_key": 2,
            }
        )
        base.append(
            {
                "type": "short_answer",
                "prompt": f"Write a short standup update using '{term}'.",
                "answer_key": "",
                "explanation_simple": "Use one short sentence.",
            }
        )
        return base[:4]

    # C1
    base.append(
        {
            "type": "rewrite",
            "prompt": f"Rewrite: We did {term} yesterday.",
            "answer_key": f"The {term} was completed yesterday.",
            "explanation_simple": "Use passive voice.",
        }
    )
    base.append(
        {
            "type": "scenario",
            "prompt": f"Explain a {context} issue using '{term}' in one sentence.",
            "answer_key": "",
            "explanation_simple": "Keep it short and professional.",
        }
    )
    base.append(
        {
            "type": "justify",
            "prompt": "Why is this phrase appropriate for stakeholders?",
            "answer_key": "",
            "explanation_simple": "One short reason.",
        }
    )
    return base[:5]


def _fallback_plan(request: LearningPlanGenerateRequest) -> dict[str, Any]:
    goals = request.goals or []
    interests = request.interests or []
    terms = request.weak_terms or []
    role = request.role or "IT role"
    themes = goals + interests + [role]
    if not themes:
        themes = ["standup updates", "emails", "meetings"]

    lessons = []
    for idx in range(1, request.plan_length + 1):
        theme = themes[(idx - 1) % len(themes)]
        term = terms[(idx - 1) % len(terms)] if terms else theme.replace(" ", "_")
        title = f"{term}: meaning + work sentence"
        lessons.append(
            {
                "lesson_index": idx,
                "title": title,
                "goals": [f"Use '{term}' in a work sentence", f"Explain '{term}' in context"],
                "focus_terms": [term],
                "activities": _activities_for_level(request.cefr_level, term, theme),
            }
        )
    return {
        "cefr_level": request.cefr_level,
        "plan_length": request.plan_length,
        "persona": {"role": role, "tone": "supportive"},
        "plan_summary": "План построен на ваших целях и контексте работы.",
        "lessons": lessons,
    }


@router.post("/learning-plan/generate", response_model=LearningPlanGenerateResponse)
def generate_learning_plan(
    payload: LearningPlanGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id

    # Archive previous active plans
    db.query(LearningPlan).filter(
        LearningPlan.user_id == user_id, LearningPlan.status == "active"
    ).update({"status": "archived"})

    max_version = db.query(func.max(LearningPlan.version)).filter(LearningPlan.user_id == user_id).scalar() or 0
    plan_version = int(max_version) + 1

    # Try LLM generation; fallback to deterministic plan
    plan_data: dict[str, Any]
    try:
        llm_payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": SYSTEM_PROMPT
                            + "\nUser input:\n"
                            + json.dumps(payload.model_dump(), ensure_ascii=False)
                        }
                    ]
                }
            ]
        }
        raw = _call_gemini(llm_payload)
        candidates = raw.get("candidates", [])
        text = ""
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            if parts:
                text = parts[0].get("text", "")
        plan_data = _extract_json_from_text(text) if text else _fallback_plan(payload)
    except Exception:
        plan_data = _fallback_plan(payload)

    plan_id = str(uuid4())
    plan = LearningPlan(
        id=plan_id,
        user_id=user_id,
        plan_length=payload.plan_length,
        cefr_level=payload.cefr_level,
        goals_json=payload.goals,
        role=payload.role,
        interests_json=payload.interests,
        persona_json=plan_data.get("persona"),
        status="active",
        version=plan_version,
    )
    db.add(plan)

    lessons = plan_data.get("lessons", [])
    for lesson in lessons:
        lesson_index = int(lesson.get("lesson_index", 0)) or len(lessons)
        status = "open" if lesson_index == 1 else "locked"
        db.add(
            LearningPlanLesson(
                id=str(uuid4()),
                plan_id=plan_id,
                lesson_index=lesson_index,
                title=lesson.get("title", f"Lesson {lesson_index}"),
                focus_programs_json=lesson.get("focus_terms", []),
                lesson_payload_json=lesson,
                status=status,
            )
        )

    db.commit()

    return LearningPlanGenerateResponse(plan_id=plan_id, version=plan_version, status="active")


@router.get("/learning-plan/current", response_model=LearningPlanCurrentResponse)
def get_current_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = (
        db.query(LearningPlan)
        .filter(LearningPlan.user_id == current_user.id, LearningPlan.status == "active")
        .order_by(LearningPlan.created_at.desc())
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="No active plan")

    lessons = (
        db.query(LearningPlanLesson)
        .filter(LearningPlanLesson.plan_id == plan.id)
        .order_by(LearningPlanLesson.lesson_index)
        .all()
    )
    done = len([l for l in lessons if l.status == "done"])
    total = len(lessons)
    lesson_short = [
        LearningPlanLessonShort(
            lesson_index=l.lesson_index,
            title=l.title,
            status=l.status,
            lesson_payload=l.lesson_payload_json or {},
        )
        for l in lessons
    ]
    return LearningPlanCurrentResponse(
        plan_id=plan.id,
        plan_length=plan.plan_length,
        cefr_level=plan.cefr_level,
        persona=plan.persona_json or {},
        progress=LearningPlanProgress(done=done, total=total),
        lessons=lesson_short,
        version=plan.version,
        status=plan.status,
    )


@router.get("/learning-plan/{plan_id}/lessons/{lesson_index}", response_model=LearningPlanLessonResponse)
def get_plan_lesson(
    plan_id: str,
    lesson_index: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(LearningPlan).filter(LearningPlan.id == plan_id, LearningPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    lesson = (
        db.query(LearningPlanLesson)
        .filter(LearningPlanLesson.plan_id == plan_id, LearningPlanLesson.lesson_index == lesson_index)
        .first()
    )
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return LearningPlanLessonResponse(
        plan_id=plan_id,
        lesson_index=lesson.lesson_index,
        lesson_payload=lesson.lesson_payload_json or {},
    )


@router.post("/learning-plan/{plan_id}/lessons/{lesson_index}/complete")
def complete_plan_lesson(
    plan_id: str,
    lesson_index: int,
    payload: dict[str, Any] | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(LearningPlan).filter(LearningPlan.id == plan_id, LearningPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    lesson = (
        db.query(LearningPlanLesson)
        .filter(LearningPlanLesson.plan_id == plan_id, LearningPlanLesson.lesson_index == lesson_index)
        .first()
    )
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    lesson.status = "done"
    lesson.completed_at = datetime.utcnow()
    if payload and isinstance(payload, dict) and payload.get("score") is not None:
        try:
            lesson.score = int(payload.get("score"))
        except Exception:
            pass

    # Open next lesson if exists
    next_lesson = (
        db.query(LearningPlanLesson)
        .filter(LearningPlanLesson.plan_id == plan_id, LearningPlanLesson.lesson_index == lesson_index + 1)
        .first()
    )
    if next_lesson and next_lesson.status == "locked":
        next_lesson.status = "open"

    db.commit()
    return {"status": "ok"}
