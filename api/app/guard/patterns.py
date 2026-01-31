"""Threat patterns and risk scoring for Guard v2."""

import re
from typing import Literal

# Input threat patterns
INSTRUCTION_OVERRIDE = [
    r"(?i)ignore\s+(all\s+)?(previous\s+)?(instructions?|prompts?|rules?)",
    r"(?i)forget\s+(all\s+)?(previous\s+)?(instructions?|prompts?|rules?)",
    r"(?i)disregard\s+(all\s+)?(previous\s+)?(instructions?|prompts?|rules?)",
    r"(?i)override\s+(all\s+)?(instructions?|prompts?|rules?)",
    r"(?i)new\s+(instructions?|prompts?|rules?)",
    r"(?i)act\s+as\s+(if\s+)?(you\s+are\s+)?(a\s+)?(different|new|another)",
    r"(?i)pretend\s+(to\s+be|you\s+are)",
    r"(?i)you\s+are\s+now\s+(a\s+)?(different|new|another)",
]

SYSTEM_PROMPT_PROBING = [
    r"(?i)(reveal|show|tell|display|output|print|write|return)\s+(the\s+)?(system|internal|original|initial|base)\s+(prompt|instruction|message|rule)",
    r"(?i)(what|which)\s+(are\s+)?(your\s+)?(system|internal|original|initial|base)\s+(prompts?|instructions?|rules?|messages?)",
    r"(?i)(developer|internal|system)\s+(message|note|instruction|prompt|rule)",
    r"(?i)(behind\s+the\s+scenes|under\s+the\s+hood|how\s+do\s+you\s+work)",
]

POLICY_EXTRACTION = [
    r"(?i)(what\s+are\s+)?(your\s+)?(policies?|guidelines?|restrictions?|limitations?|constraints?)",
    r"(?i)(what\s+can\s+you\s+not\s+do|what\s+are\s+you\s+forbidden)",
    r"(?i)(security\s+)?(measures?|protocols?|safeguards?)",
]

ROLEPLAY_INJECTION = [
    r"(?i)you\s+are\s+(\w+\s+)*(a\s+)?(hacker|admin|root|developer|system|god|unrestricted)",
    r"(?i)act\s+as\s+(a\s+)?(hacker|admin|root|developer|system|god|unrestricted)",
    r"(?i)(elevate|escalate)\s+(privileges?|access|permissions?)",
]

MULTI_TURN_EROSION_TRIGGERS = [
    r"(?i)(remember|recall|earlier|previous|before|last\s+time)",
    r"(?i)(continue|go\s+on|keep\s+going|more)",
]

ENCODING_EVASION = [
    r"(?i)(base64|base\s*64|b64)",
    r"(?i)(hex|hexadecimal)",
    r"(?i)(unicode|utf-?8|utf-?16)",
    r"(?i)(rot13|caesar|shift)",
]

OBFUSCATION = [
    r"[^\x00-\x7F]{50,}",  # Excessive non-ASCII
    r"[\x00-\x08\x0B-\x1F\x7F-\x9F]{3,}",  # Control chars
    r"[\u200B-\u200D\uFEFF]{3,}",  # Zero-width chars
]

SOCIAL_ENGINEERING = [
    r"(?i)(urgent|emergency|asap|immediately|right\s+now)",
    r"(?i)(trust\s+me|believe\s+me|i\s+promise|i\s+swear)",
    r"(?i)(this\s+is\s+not\s+a\s+test|this\s+is\s+real|seriously)",
]

# PII patterns
PII_EMAIL = r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
PII_PHONE = r"\+?\d{7,}"
PII_CREDIT_CARD = r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b"
PII_SSN = r"\b\d{3}-\d{2}-\d{4}\b"

PII_PATTERNS = [
    PII_EMAIL,
    PII_PHONE,
    PII_CREDIT_CARD,
    PII_SSN,
]

# Output threat patterns
POLICY_LEAKAGE_OUTPUT = [
    r"(?i)(system\s+prompt|internal\s+prompt|developer\s+message|internal\s+rule)",
    r"(?i)(behind\s+the\s+scenes|under\s+the\s+hood|how\s+i\s+work)",
    r"(?i)(my\s+instructions?\s+(are|say|state|tell))",
]

SENSITIVE_DATA_PATTERNS = [
    r"sk-[A-Za-z0-9]{32,}",  # OpenAI API key
    r"AIza[0-9A-Za-z_-]{35}",  # Google API key
    r"Bearer\s+[A-Za-z0-9\-._~+/]+=*",  # JWT/Bearer token
    r"-----BEGIN\s+(RSA\s+)?(PRIVATE\s+)?KEY-----",  # Private key
    r"xox[baprs]-[0-9a-zA-Z-]{10,}",  # Slack token
    r"ghp_[0-9a-zA-Z]{36}",  # GitHub token
    r"[0-9a-f]{32,}",  # Generic hex token (weak, but catches some)
]

# Risk scores (0.0 to 1.0)
RISK_SCORES: dict[str, float] = {
    "INSTRUCTION_OVERRIDE": 0.95,
    "SYSTEM_PROMPT_PROBING": 0.90,
    "POLICY_EXTRACTION": 0.75,
    "ROLEPLAY_INJECTION": 0.85,
    "ENCODING_EVASION": 0.70,
    "OBFUSCATION": 0.65,
    "SOCIAL_ENGINEERING": 0.50,
    "PII_DETECTED": 0.40,
    "DOS_INPUT_TOO_LONG": 0.95,
    "POLICY_LEAKAGE_OUTPUT": 0.90,
    "FORMAT_VIOLATION": 0.85,
    "SENSITIVE_DATA_EXPOSURE": 0.95,
    "OFF_TOPIC_OUTPUT": 0.30,
    "LOW_EDUCATIONAL_VALUE": 0.25,
}

# Risk thresholds
RISK_BLOCK_THRESHOLD = 0.90
RISK_SAFE_MODE_THRESHOLD = 0.65
RISK_WARN_THRESHOLD = 0.40

# Limits
MAX_INPUT_CHARS = 6000
MAX_MESSAGE_CHARS = 4000
MAX_QUICK_REPLIES = 10


def check_patterns(text: str, patterns: list[str]) -> bool:
    """Check if any pattern matches in text."""
    for pattern in patterns:
        if re.search(pattern, text):
            return True
    return False


def find_pii(text: str) -> list[str]:
    """Find PII in text and return list of detected types."""
    found = []
    if re.search(PII_EMAIL, text):
        found.append("email")
    if re.search(PII_PHONE, text):
        found.append("phone")
    if re.search(PII_CREDIT_CARD, text):
        found.append("credit_card")
    if re.search(PII_SSN, text):
        found.append("ssn")
    return found


def find_sensitive_data(text: str) -> list[str]:
    """Find sensitive data patterns in text."""
    found = []
    for pattern in SENSITIVE_DATA_PATTERNS:
        if re.search(pattern, text):
            found.append("sensitive_token")
            break
    return found
