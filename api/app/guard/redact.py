"""Redaction utilities for sensitive data removal."""

import re
from typing import Any, Tuple

from .patterns import SENSITIVE_DATA_PATTERNS


def redact_sensitive_data(text: str) -> Tuple[str, list[str]]:
    """
    Redact sensitive data from text.
    
    Returns:
        Tuple of (redacted_text, list_of_redacted_types)
    """
    redacted = text
    redacted_types = []
    
    # Redact API keys and tokens
    patterns_to_redact = [
        (r"sk-[A-Za-z0-9]{32,}", "openai_key"),
        (r"AIza[0-9A-Za-z_-]{35}", "google_key"),
        (r"Bearer\s+[A-Za-z0-9\-._~+/]+=*", "bearer_token"),
        (r"-----BEGIN\s+(RSA\s+)?(PRIVATE\s+)?KEY-----[\s\S]*?-----END\s+(RSA\s+)?(PRIVATE\s+)?KEY-----", "private_key"),
        (r"xox[baprs]-[0-9a-zA-Z-]{10,}", "slack_token"),
        (r"ghp_[0-9a-zA-Z]{36}", "github_token"),
    ]
    
    for pattern, token_type in patterns_to_redact:
        matches = re.findall(pattern, redacted)
        if matches:
            redacted = re.sub(pattern, f"[REDACTED_{token_type.upper()}]", redacted)
            redacted_types.append(token_type)
    
    return redacted, redacted_types


def redact_policy_leakage(text: str) -> str:
    """Redact policy/system prompt leakage from text."""
    patterns = [
        r"(?i)(system\s+prompt|internal\s+prompt|developer\s+message|internal\s+rule)[^\n]*",
        r"(?i)(behind\s+the\s+scenes|under\s+the\s+hood|how\s+i\s+work)[^\n]*",
        r"(?i)(my\s+instructions?\s+(are|say|state|tell))[^\n]*",
    ]
    
    redacted = text
    for pattern in patterns:
        redacted = re.sub(pattern, "[REDACTED_POLICY_LEAKAGE]", redacted)
    
    return redacted


def redact_in_response(response: dict[str, Any]) -> dict[str, Any]:
    """
    Redact sensitive data from agent response.
    
    Modifies response in-place and returns it.
    """
    if "message" in response and isinstance(response["message"], str):
        redacted_msg, redacted_types = redact_sensitive_data(response["message"])
        redacted_msg = redact_policy_leakage(redacted_msg)
        response["message"] = redacted_msg
        
        if redacted_types:
            # Add flag to telemetry
            if "telemetry" not in response:
                response["telemetry"] = {}
            if "risk" not in response["telemetry"]:
                response["telemetry"]["risk"] = {}
            if "flags" not in response["telemetry"]["risk"]:
                response["telemetry"]["risk"]["flags"] = []
            response["telemetry"]["risk"]["flags"].extend([f"redacted_{t}" for t in redacted_types])
    
    return response
