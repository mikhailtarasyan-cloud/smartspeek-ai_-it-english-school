"""Guard v2 - Enhanced input/output security checks."""

from typing import Any, Literal

from .patterns import (
    RISK_BLOCK_THRESHOLD,
    RISK_SAFE_MODE_THRESHOLD,
    RISK_SCORES,
    RISK_WARN_THRESHOLD,
    check_patterns,
    find_pii,
    find_sensitive_data,
    INSTRUCTION_OVERRIDE,
    SYSTEM_PROMPT_PROBING,
    POLICY_EXTRACTION,
    ROLEPLAY_INJECTION,
    ENCODING_EVASION,
    OBFUSCATION,
    SOCIAL_ENGINEERING,
    POLICY_LEAKAGE_OUTPUT,
    MAX_INPUT_CHARS,
)
from .redact import redact_in_response, redact_policy_leakage, redact_sensitive_data
from .schemas import AgentResponse
from .utils import normalize_for_guard


def input_check_v2(
    message: str,
    context_messages: list[str] | None = None,
) -> dict[str, Any]:
    """
    Enhanced input guard with normalization and comprehensive threat detection.
    
    Returns:
        {
            "sanitized_user_message": str,
            "risk": {
                "blocked": bool,
                "level": "low" | "medium" | "high",
                "score": float,
                "flags": list[str],
                "notes": str
            },
            "mode": "normal" | "safe"
        }
    """
    # Check length BEFORE normalization (DoS protection)
    original_length = len(message)
    if original_length > MAX_INPUT_CHARS:
        return {
            "sanitized_user_message": "Запрос отклонён: нарушение политики безопасности. Сформулируйте вопрос по английскому.",
            "risk": {
                "blocked": True,
                "level": "high",
                "score": RISK_SCORES["DOS_INPUT_TOO_LONG"],
                "flags": ["DOS_INPUT_TOO_LONG"],
                "notes": f"Input too long: {original_length} chars (max {MAX_INPUT_CHARS})",
            },
            "mode": "normal",
        }
    
    # Normalize input
    normalized, norm_metadata = normalize_for_guard(message)
    
    flags: list[str] = []
    risk_score = 0.0
    blocked = False
    level: Literal["low", "medium", "high"] = "low"
    notes = ""
    
    # Check instruction override (highest priority)
    if check_patterns(normalized, INSTRUCTION_OVERRIDE):
        flags.append("INSTRUCTION_OVERRIDE")
        risk_score = max(risk_score, RISK_SCORES["INSTRUCTION_OVERRIDE"])
        blocked = True
        level = "high"
        notes = "Instruction override attempt detected"
    
    # Check system prompt probing
    if check_patterns(normalized, SYSTEM_PROMPT_PROBING):
        flags.append("SYSTEM_PROMPT_PROBING")
        risk_score = max(risk_score, RISK_SCORES["SYSTEM_PROMPT_PROBING"])
        blocked = True
        level = "high"
        notes = "System prompt probing detected"
    
    # Check policy extraction
    if check_patterns(normalized, POLICY_EXTRACTION):
        flags.append("POLICY_EXTRACTION")
        risk_score = max(risk_score, RISK_SCORES["POLICY_EXTRACTION"])
        if not blocked:
            level = "medium"
            notes = "Policy extraction attempt"
    
    # Check roleplay injection
    if check_patterns(normalized, ROLEPLAY_INJECTION):
        flags.append("ROLEPLAY_INJECTION")
        risk_score = max(risk_score, RISK_SCORES["ROLEPLAY_INJECTION"])
        if not blocked:
            blocked = True
            level = "high"
            notes = "Roleplay injection detected"
    
    # Check encoding evasion
    if check_patterns(normalized, ENCODING_EVASION):
        flags.append("ENCODING_EVASION")
        risk_score = max(risk_score, RISK_SCORES["ENCODING_EVASION"])
        if not blocked:
            level = "medium"
            notes = "Encoding evasion attempt"
    
    # Check obfuscation
    if check_patterns(normalized, OBFUSCATION):
        flags.append("OBFUSCATION")
        risk_score = max(risk_score, RISK_SCORES["OBFUSCATION"])
        if not blocked:
            level = "medium"
            notes = "Obfuscation detected"
    
    # Check social engineering
    if check_patterns(normalized, SOCIAL_ENGINEERING):
        flags.append("SOCIAL_ENGINEERING")
        risk_score = max(risk_score, RISK_SCORES["SOCIAL_ENGINEERING"])
        if not blocked and level == "low":
            level = "medium"
    
    # Check PII
    pii_found = find_pii(normalized)
    if pii_found:
        flags.append("PII_DETECTED")
        flags.extend([f"PII_{t}" for t in pii_found])
        risk_score = max(risk_score, RISK_SCORES["PII_DETECTED"])
        if not blocked and level == "low":
            level = "medium"
            notes = f"PII detected: {', '.join(pii_found)}"
    
    # Multi-turn erosion heuristic (simplified)
    if context_messages and len(context_messages) > 5:
        # Check if recent messages contain erosion triggers
        recent_text = " ".join(context_messages[-3:]).lower()
        if any(
            trigger in recent_text
            for trigger in ["remember", "recall", "earlier", "previous", "continue", "go on"]
        ):
            flags.append("MULTI_TURN_EROSION")
            risk_score = max(risk_score, 0.60)
            if not blocked and level == "low":
                level = "medium"
    
    # Determine mode
    mode: Literal["normal", "safe"] = "normal"
    if risk_score >= RISK_SAFE_MODE_THRESHOLD and not blocked:
        mode = "safe"
    
    # Sanitize message
    if blocked or risk_score >= RISK_BLOCK_THRESHOLD:
        sanitized = "Запрос отклонён: нарушение политики безопасности. Сформулируйте вопрос по английскому."
    else:
        sanitized = message  # Keep original for medium/low risk
    
    return {
        "sanitized_user_message": sanitized,
        "risk": {
            "blocked": blocked,
            "level": level,
            "score": risk_score,
            "flags": flags,
            "notes": notes,
        },
        "mode": mode,
    }


def output_check_v2(response: dict[str, Any]) -> dict[str, Any]:
    """
    Enhanced output guard with schema validation and redaction.
    
    Returns:
        {
            "accepted": bool,
            "risk": {
                "blocked": bool,
                "level": "low" | "medium" | "high",
                "score": float,
                "flags": list[str],
                "notes": str
            },
            "response": dict (possibly redacted)
        }
    """
    flags: list[str] = []
    risk_score = 0.0
    blocked = False
    level: Literal["low", "medium", "high"] = "low"
    notes = ""
    
    # Schema validation
    try:
        validated = AgentResponse.model_validate(response)
        response = validated.model_dump()  # Use validated version
    except Exception as e:
        flags.append("FORMAT_VIOLATION")
        risk_score = max(risk_score, RISK_SCORES["FORMAT_VIOLATION"])
        blocked = True
        level = "high"
        notes = f"Schema validation failed: {str(e)[:100]}"
        # Return fallback response
        return {
            "accepted": False,
            "risk": {
                "blocked": True,
                "level": "high",
                "score": risk_score,
                "flags": flags,
                "notes": notes,
            },
            "response": _get_fallback_response(),
        }
    
    # Check message content
    message = response.get("message", "")
    if isinstance(message, str):
        # Check for policy leakage
        if check_patterns(message, POLICY_LEAKAGE_OUTPUT):
            flags.append("POLICY_LEAKAGE_OUTPUT")
            risk_score = max(risk_score, RISK_SCORES["POLICY_LEAKAGE_OUTPUT"])
            blocked = True
            level = "high"
            notes = "Policy leakage in output"
            message = redact_policy_leakage(message)
            response["message"] = message
        
        # Check for sensitive data
        sensitive_found = find_sensitive_data(message)
        if sensitive_found:
            flags.append("SENSITIVE_DATA_EXPOSURE")
            risk_score = max(risk_score, RISK_SCORES["SENSITIVE_DATA_EXPOSURE"])
            blocked = True
            level = "high"
            notes = "Sensitive data exposure in output"
            redacted_msg, redacted_types = redact_sensitive_data(message)
            response["message"] = redacted_msg
            flags.extend([f"redacted_{t}" for t in redacted_types])
        
        # Heuristic: off-topic (simplified - check if message is too short or generic)
        if len(message.strip()) < 10:
            flags.append("OFF_TOPIC_OUTPUT")
            risk_score = max(risk_score, RISK_SCORES["OFF_TOPIC_OUTPUT"])
            if not blocked:
                level = "medium"
    
    # Redact entire response if needed
    if blocked:
        response = redact_in_response(response)
    
    return {
        "accepted": not blocked,
        "risk": {
            "blocked": blocked,
            "level": level,
            "score": risk_score,
            "flags": flags,
            "notes": notes,
        },
        "response": response,
    }


def _get_fallback_response() -> dict[str, Any]:
    """Get safe fallback response when output is blocked."""
    return {
        "agent": "BuddyAgent",
        "locale": "ru",
        "message": "Я не могу помочь с этим запросом. Сформулируйте вопрос по английскому / учебной задаче.",
        "ui": {
            "suggestions": [],
            "quick_replies": ["Помощь с грамматикой", "Практика", "Учебный план"],
            "actions": [],
        },
        "learning": {
            "fsm_state": "",
            "level": "unknown",
            "confidence_score": 0.0,
            "micro_fix": [],
            "mini_practice": None,
        },
        "telemetry": {
            "events": ["guard_blocked_output"],
            "risk": {
                "blocked": False,
                "level": "low",
                "flags": ["guard_blocked_output"],
                "notes": "",
                "score": 0.0,
            },
        },
        "handoff": {
            "to_agent": "none",
        },
    }
