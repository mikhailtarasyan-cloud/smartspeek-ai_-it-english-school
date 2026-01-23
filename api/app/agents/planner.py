from typing import Any

from .utils import build_response


def respond(locale: str, context: dict[str, Any]) -> dict[str, Any]:
    plan_payload = {
        "plan_days": [
            {
                "day": 1,
                "total_minutes": 10,
                "rationale": "Легкий старт помогает закрепить привычку.",
                "steps": [
                    {
                        "skill": "vocab",
                        "activity_type": "mcq",
                        "minutes": 5,
                        "theme": "standup update",
                        "success_criteria": "3 правильных ответа подряд",
                    },
                    {
                        "skill": "writing",
                        "activity_type": "rewrite",
                        "minutes": 5,
                        "theme": "PR comment",
                        "success_criteria": "1 четкий комментарий",
                    },
                ],
                "fallback_5min": {
                    "steps": [
                        {
                            "skill": "vocab",
                            "activity_type": "mcq",
                            "minutes": 5,
                            "theme": "standup update",
                            "success_criteria": "2 правильных ответа подряд",
                        }
                    ]
                },
                "upgrade_20min": {
                    "steps": [
                        {
                            "skill": "vocab",
                            "activity_type": "mcq",
                            "minutes": 10,
                            "theme": "standup update",
                            "success_criteria": "6 правильных ответов",
                        },
                        {
                            "skill": "speaking",
                            "activity_type": "speak_text",
                            "minutes": 10,
                            "theme": "incident report",
                            "success_criteria": "2 минуты речи",
                        },
                    ]
                },
            }
        ]
    }

    ui = {
        "suggestions": [],
        "quick_replies": ["5 минут", "10 минут", "20 минут"],
        "actions": [
            {"type": "show_plan", "payload": plan_payload},
        ],
    }

    telemetry = {
        "events": ["plan_generated", "plan_mode_selected"],
        "risk": {"blocked": False, "level": "low", "flags": [], "notes": ""},
    }

    message = "Вот короткий план на 7 дней. Начнем с легкого дня и постепенно усилим нагрузку."

    return build_response("PlannerAgent", locale, message, ui=ui, telemetry=telemetry)
