from typing import Any


def build_response(
    agent: str,
    locale: str,
    message: str,
    ui: dict[str, Any] | None = None,
    learning: dict[str, Any] | None = None,
    telemetry: dict[str, Any] | None = None,
    handoff: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "agent": agent,
        "locale": locale,
        "message": message,
        "ui": ui
        or {
            "suggestions": [],
            "quick_replies": [],
            "actions": [],
        },
        "learning": learning
        or {
            "fsm_state": "",
            "level": "unknown",
            "confidence_score": 0.0,
            "micro_fix": [],
            "mini_practice": None,
        },
        "telemetry": telemetry
        or {
            "events": [],
            "risk": {
                "blocked": False,
                "level": "low",
                "flags": [],
                "notes": "",
            },
        },
        "handoff": handoff or {"to_agent": "none"},
    }
