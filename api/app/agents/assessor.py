from typing import Any

from .utils import build_response


def respond(locale: str, context: dict[str, Any]) -> dict[str, Any]:
    message = (
        "Оценка выполнена. Кратко: хорошая ясность и структура, есть мелкие ошибки в временах."
    )

    learning = {
        "fsm_state": context.get("fsm_state", ""),
        "level": "B1",
        "confidence_score": 0.55,
        "micro_fix": [
            {"tag": "verb_tense", "before": "I am work on it", "after": "I am working on it"},
        ],
        "mini_practice": None,
    }

    telemetry = {
        "events": ["assessment_completed", "cefr_mapped"],
        "risk": {"blocked": False, "level": "low", "flags": [], "notes": ""},
    }

    return build_response("AssessorAgent", locale, message, learning=learning, telemetry=telemetry)
