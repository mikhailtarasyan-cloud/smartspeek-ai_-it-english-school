from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import httpx

from app.config import settings
from app.db import get_db
from sqlalchemy.orm import Session

router = APIRouter()

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
DEFAULT_MODEL = "gemini-2.5-flash"


class OnboardingRequest(BaseModel):
    onboarding: dict


class TutorInsightsRequest(BaseModel):
    prompt: str


class DiagnosticRequest(BaseModel):
    step_type: str
    question: str
    answer: str


async def _call_gemini(model: str, payload: dict) -> dict:
    if not settings.llm_api_key:
        raise HTTPException(status_code=500, detail="LLM_API_KEY is not configured on backend")

    url = GEMINI_API_URL.format(model=model or DEFAULT_MODEL)
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            url,
            params={"key": settings.llm_api_key},
            json=payload,
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail={"error": resp.json()})
    return resp.json()


@router.post("/ai/process-onboarding")
async def process_onboarding(payload: OnboardingRequest, db: Session = Depends(get_db)):
    # TODO: сохранить результат онбординга в user_profile.preferences_json
    request_body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": (
                            "Ты — SmartSpeek AI Orchestrator. На основе данных онбординга: "
                            + str(payload.onboarding)
                            + ", сгенерируй детальную стратегию обучения. "
                            "ВСЕ ТЕКСТЫ В JSON ДОЛЖНЫ БЫТЬ НА РУССКОМ."
                        )
                    }
                ]
            }
        ]
    }

    data = await _call_gemini(DEFAULT_MODEL, request_body)
    return {"raw": data}


@router.post("/ai/tutor-insights")
async def tutor_insights(payload: TutorInsightsRequest):
    request_body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": (
                            payload.prompt
                            + ". Дай 3 совета по обучению на русском языке. "
                            "Включи один карьерный совет для IT и одну мотивационную фразу."
                        )
                    }
                ]
            }
        ]
    }

    data = await _call_gemini(DEFAULT_MODEL, request_body)
    return {"raw": data}


@router.post("/ai/evaluate-diagnostic")
async def evaluate_diagnostic(payload: DiagnosticRequest):
    request_body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": (
                            "Ты — профессиональный методист английского языка. Оцени ответ студента. "
                            f"Тип задания: {payload.step_type}. Вопрос: {payload.question}. "
                            f"Ответ студента: {payload.answer}."
                        )
                    }
                ]
            }
        ]
    }

    data = await _call_gemini(DEFAULT_MODEL, request_body)
    return {"raw": data}