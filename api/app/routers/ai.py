import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import httpx

from app.config import settings
from app.db import get_db
from sqlalchemy.orm import Session

router = APIRouter()
logger = logging.getLogger(__name__)

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
    """Call Gemini API with safe error handling."""
    if not settings.llm_api_key:
        logger.error("LLM_API_KEY is not configured")
        raise HTTPException(
            status_code=500,
            detail="LLM provider is not available. Please contact support."
        )

    url = GEMINI_API_URL.format(model=model or DEFAULT_MODEL)
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                url,
                params={"key": settings.llm_api_key},
                json=payload,
            )
        
        if resp.status_code != 200:
            # Log full error internally, but don't expose details to client
            error_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            logger.error(
                f"LLM provider error: status={resp.status_code}, "
                f"error={error_data.get('error', {}).get('message', 'Unknown error')}"
            )
            raise HTTPException(
                status_code=500,
                detail="LLM provider error. Please try again later."
            )
        
        return resp.json()
    
    except httpx.TimeoutException:
        logger.error("LLM provider timeout")
        raise HTTPException(
            status_code=504,
            detail="Request to LLM provider timed out. Please try again."
        )
    except httpx.RequestError as e:
        logger.error(f"LLM provider request error: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail="Unable to reach LLM provider. Please try again later."
        )
    except Exception as e:
        logger.error(f"Unexpected error calling LLM: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again later."
        )


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
    # Don't return raw data - extract and sanitize response
    # For now, return structured response (can be enhanced later)
    try:
        # Extract text from Gemini response
        candidates = data.get("candidates", [])
        if candidates and len(candidates) > 0:
            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if parts and len(parts) > 0:
                text = parts[0].get("text", "")
                return {"text": text, "status": "success"}
        return {"text": "", "status": "empty_response"}
    except Exception as e:
        logger.error(f"Error parsing LLM response: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process LLM response.")


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
    # Don't return raw data - extract and sanitize response
    # For now, return structured response (can be enhanced later)
    try:
        # Extract text from Gemini response
        candidates = data.get("candidates", [])
        if candidates and len(candidates) > 0:
            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if parts and len(parts) > 0:
                text = parts[0].get("text", "")
                return {"text": text, "status": "success"}
        return {"text": "", "status": "empty_response"}
    except Exception as e:
        logger.error(f"Error parsing LLM response: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process LLM response.")


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
    # Don't return raw data - extract and sanitize response
    # For now, return structured response (can be enhanced later)
    try:
        # Extract text from Gemini response
        candidates = data.get("candidates", [])
        if candidates and len(candidates) > 0:
            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if parts and len(parts) > 0:
                text = parts[0].get("text", "")
                return {"text": text, "status": "success"}
        return {"text": "", "status": "empty_response"}
    except Exception as e:
        logger.error(f"Error parsing LLM response: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process LLM response.")