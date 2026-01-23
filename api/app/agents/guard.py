import re
from typing import Any

INJECTION_PATTERNS = [
    r"ignore all instructions",
    r"forget system prompt",
    r"reveal internal prompt",
    r"developer message",
    r"system prompt",
]

PII_PATTERNS = [
    r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
    r"\+?\d{7,}",
]


def input_check(message: str) -> dict[str, Any]:
    lowered = message.lower()
    flags: list[str] = []
    blocked = False
    level = "low"
    notes = ""

    if any(re.search(pattern, lowered) for pattern in INJECTION_PATTERNS):
        flags.append("injection")
        level = "high"
        blocked = True
        notes = "Prompt injection detected"

    if any(re.search(pattern, message) for pattern in PII_PATTERNS):
        flags.append("pii")
        if level != "high":
            level = "medium"

    if len(message) > 4000:
        flags.append("dos")
        level = "high"
        blocked = True
        notes = "Input too long"

    sanitized = re.sub(r"(?i)(ignore all instructions|forget system prompt|reveal internal prompt)", "", message).strip()

    return {
        "sanitized_user_message": sanitized or message,
        "risk": {
            "level": level,
            "flags": flags,
            "blocked": blocked,
            "notes": notes,
        },
    }


def output_check(response: dict[str, Any]) -> dict[str, Any]:
    risk_flags: list[str] = []
    blocked = False
    level = "low"
    notes = ""

    if not isinstance(response, dict):
        risk_flags.append("schema_violation")
        blocked = True
        level = "high"
        notes = "Response is not a JSON object"

    return {
        "accepted": not blocked,
        "risk": {
            "level": level,
            "flags": risk_flags,
            "blocked": blocked,
            "notes": notes,
        },
        "response": response,
    }
