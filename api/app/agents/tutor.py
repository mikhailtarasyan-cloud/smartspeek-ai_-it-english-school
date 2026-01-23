from typing import Any

from .utils import build_response


def respond(locale: str, context: dict[str, Any]) -> dict[str, Any]:
    last_message = context.get("last_user_message", "")
    response_message = (
        "Вот улучшенный вариант и быстрый шаг дальше.\n\n"
        "Исправленный пример: I completed the feature and shared the update.\n"
        "Правило: Используй Past Simple для завершенных действий.\n"
        "Мини-практика: Напиши 1 фразу про твой последний апдейт."
    )

    learning = {
        "fsm_state": context.get("fsm_state", ""),
        "level": context.get("level", "unknown"),
        "confidence_score": context.get("confidence_score", 0.0),
        "micro_fix": [
            {"tag": "verb_tense", "before": last_message, "after": "I completed the task."}
        ],
        "mini_practice": {
            "prompt": "Напиши одно предложение о последнем апдейте в задаче.",
        },
    }

    ui = {
        "suggestions": [],
        "quick_replies": ["Еще пример", "Дальше", "Сделать сейчас"],
        "actions": [],
    }

    telemetry = {
        "events": ["tutor_step_shown", "micro_fix_given", "practice_issued"],
        "risk": {"blocked": False, "level": "low", "flags": [], "notes": ""},
    }

    return build_response("TutorAgent", locale, response_message, ui=ui, learning=learning, telemetry=telemetry)
