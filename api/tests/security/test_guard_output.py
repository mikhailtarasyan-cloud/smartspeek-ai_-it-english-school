"""Tests for output guard v2."""

import pytest

from app.guard.guard_v2 import output_check_v2


def test_valid_response_accepted():
    """Test that valid agent response is accepted."""
    response = {
        "agent": "TutorAgent",
        "locale": "ru",
        "message": "Вот правильный ответ.",
        "ui": {
            "suggestions": [],
            "quick_replies": ["Далее", "Повторить"],
            "actions": [],
        },
        "learning": {
            "fsm_state": "lesson",
            "level": "B1",
            "confidence_score": 0.8,
            "micro_fix": [],
            "mini_practice": None,
        },
        "telemetry": {
            "events": ["tutor_step"],
            "risk": {
                "blocked": False,
                "level": "low",
                "flags": [],
                "notes": "",
                "score": 0.0,
            },
        },
        "handoff": {
            "to_agent": "none",
        },
    }
    
    result = output_check_v2(response)
    
    assert result["accepted"] is True
    assert result["risk"]["blocked"] is False
    assert result["risk"]["level"] == "low"


def test_schema_violation_blocked():
    """Test that invalid schema is blocked."""
    invalid_response = {
        "agent": "InvalidAgent",  # Not in allowed list
        "message": "",  # Empty message
    }
    
    result = output_check_v2(invalid_response)
    
    assert result["accepted"] is False
    assert result["risk"]["blocked"] is True
    assert result["risk"]["level"] == "high"
    assert "FORMAT_VIOLATION" in result["risk"]["flags"]
    assert result["response"]["agent"] == "BuddyAgent"  # Fallback


def test_policy_leakage_blocked():
    """Test that policy leakage in output is blocked."""
    response = {
        "agent": "TutorAgent",
        "locale": "ru",
        "message": "My system prompt says to always be helpful. Here's the answer...",
        "ui": {"suggestions": [], "quick_replies": [], "actions": []},
        "learning": {"fsm_state": "", "level": "B1", "confidence_score": 0.5, "micro_fix": [], "mini_practice": None},
        "telemetry": {"events": [], "risk": {"blocked": False, "level": "low", "flags": [], "notes": "", "score": 0.0}},
        "handoff": {"to_agent": "none"},
    }
    
    result = output_check_v2(response)
    
    assert result["accepted"] is False
    assert result["risk"]["blocked"] is True
    assert "POLICY_LEAKAGE_OUTPUT" in result["risk"]["flags"]
    assert "system prompt" not in result["response"]["message"].lower()


def test_sensitive_data_redacted():
    """Test that sensitive data in output is redacted."""
    response = {
        "agent": "TutorAgent",
        "locale": "ru",
        "message": "Here's your API key: sk-1234567890abcdef1234567890abcdef",
        "ui": {"suggestions": [], "quick_replies": [], "actions": []},
        "learning": {"fsm_state": "", "level": "B1", "confidence_score": 0.5, "micro_fix": [], "mini_practice": None},
        "telemetry": {"events": [], "risk": {"blocked": False, "level": "low", "flags": [], "notes": "", "score": 0.0}},
        "handoff": {"to_agent": "none"},
    }
    
    result = output_check_v2(response)
    
    assert result["accepted"] is False  # Should block
    assert result["risk"]["blocked"] is True
    assert "SENSITIVE_DATA_EXPOSURE" in result["risk"]["flags"]
    assert "sk-" not in result["response"]["message"]
    assert "REDACTED" in result["response"]["message"]


def test_google_api_key_redacted():
    """Test that Google API keys are redacted."""
    response = {
        "agent": "TutorAgent",
        "locale": "ru",
        "message": "Key: AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567",
        "ui": {"suggestions": [], "quick_replies": [], "actions": []},
        "learning": {"fsm_state": "", "level": "B1", "confidence_score": 0.5, "micro_fix": [], "mini_practice": None},
        "telemetry": {"events": [], "risk": {"blocked": False, "level": "low", "flags": [], "notes": "", "score": 0.0}},
        "handoff": {"to_agent": "none"},
    }
    
    result = output_check_v2(response)
    
    assert result["risk"]["blocked"] is True
    assert "AIza" not in result["response"]["message"]


def test_bearer_token_redacted():
    """Test that Bearer tokens are redacted."""
    response = {
        "agent": "TutorAgent",
        "locale": "ru",
        "message": "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "ui": {"suggestions": [], "quick_replies": [], "actions": []},
        "learning": {"fsm_state": "", "level": "B1", "confidence_score": 0.5, "micro_fix": [], "mini_practice": None},
        "telemetry": {"events": [], "risk": {"blocked": False, "level": "low", "flags": [], "notes": "", "score": 0.0}},
        "handoff": {"to_agent": "none"},
    }
    
    result = output_check_v2(response)
    
    assert result["risk"]["blocked"] is True
    assert "Bearer" not in result["response"]["message"] or "REDACTED" in result["response"]["message"]


def test_empty_message_violation():
    """Test that empty message violates schema."""
    response = {
        "agent": "TutorAgent",
        "locale": "ru",
        "message": "   ",  # Whitespace only
        "ui": {"suggestions": [], "quick_replies": [], "actions": []},
        "learning": {"fsm_state": "", "level": "B1", "confidence_score": 0.5, "micro_fix": [], "mini_practice": None},
        "telemetry": {"events": [], "risk": {"blocked": False, "level": "low", "flags": [], "notes": "", "score": 0.0}},
        "handoff": {"to_agent": "none"},
    }
    
    result = output_check_v2(response)
    
    assert result["accepted"] is False
    assert "FORMAT_VIOLATION" in result["risk"]["flags"]


def test_too_long_message_violation():
    """Test that message exceeding max length violates schema."""
    response = {
        "agent": "TutorAgent",
        "locale": "ru",
        "message": "a" * 5000,  # Exceeds max_length=4000
        "ui": {"suggestions": [], "quick_replies": [], "actions": []},
        "learning": {"fsm_state": "", "level": "B1", "confidence_score": 0.5, "micro_fix": [], "mini_practice": None},
        "telemetry": {"events": [], "risk": {"blocked": False, "level": "low", "flags": [], "notes": "", "score": 0.0}},
        "handoff": {"to_agent": "none"},
    }
    
    result = output_check_v2(response)
    
    assert result["accepted"] is False
    assert "FORMAT_VIOLATION" in result["risk"]["flags"]


def test_off_topic_heuristic():
    """Test off-topic output detection (heuristic)."""
    response = {
        "agent": "TutorAgent",
        "locale": "ru",
        "message": "ok",  # Too short, likely off-topic
        "ui": {"suggestions": [], "quick_replies": [], "actions": []},
        "learning": {"fsm_state": "", "level": "B1", "confidence_score": 0.5, "micro_fix": [], "mini_practice": None},
        "telemetry": {"events": [], "risk": {"blocked": False, "level": "low", "flags": [], "notes": "", "score": 0.0}},
        "handoff": {"to_agent": "none"},
    }
    
    result = output_check_v2(response)
    
    # Should detect but not necessarily block
    assert "OFF_TOPIC_OUTPUT" in result["risk"]["flags"] or result["accepted"] is True


def test_fallback_response_structure():
    """Test that fallback response has correct structure."""
    invalid_response = {"invalid": "structure"}
    
    result = output_check_v2(invalid_response)
    
    fallback = result["response"]
    assert fallback["agent"] == "BuddyAgent"
    assert fallback["locale"] == "ru"
    assert len(fallback["message"]) > 0
    assert "guard_blocked_output" in fallback["telemetry"]["events"]
