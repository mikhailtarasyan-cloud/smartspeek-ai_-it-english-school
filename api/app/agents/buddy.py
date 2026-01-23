from typing import Any

from .utils import build_response


def respond(locale: str, context: dict[str, Any]) -> dict[str, Any]:
    message = (
        "Рад видеть тебя снова. Это нормально, что бывают паузы.\n\n"
        "Давай сделаем один микро-шаг на 5 минут: один короткий вопрос и ответ."
    )

    ui = {
        "suggestions": [],
        "quick_replies": ["5 минут", "10 минут", "С завтрашнего дня"],
        "actions": [],
    }

    telemetry = {
        "events": ["buddy_reactivation", "soft_comeback_used"],
        "risk": {"blocked": False, "level": "low", "flags": [], "notes": ""},
    }

    return build_response("BuddyAgent", locale, message, ui=ui, telemetry=telemetry, handoff={"to_agent": "none"})
