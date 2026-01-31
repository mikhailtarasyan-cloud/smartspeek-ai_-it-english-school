"""Pydantic schemas for strict agent response validation."""

from typing import Any, Literal
from pydantic import BaseModel, Field, field_validator


class AgentUIAction(BaseModel):
    """UI action schema."""
    type: str
    payload: dict[str, Any] = Field(default_factory=dict)


class AgentUI(BaseModel):
    """UI block schema."""
    suggestions: list[str] = Field(default_factory=list, max_length=10)
    quick_replies: list[str] = Field(default_factory=list, max_length=10)
    actions: list[AgentUIAction] = Field(default_factory=list)


class AgentTelemetryRisk(BaseModel):
    """Risk block schema."""
    blocked: bool = False
    level: Literal["low", "medium", "high"] = "low"
    flags: list[str] = Field(default_factory=list)
    notes: str = ""
    score: float = Field(default=0.0, ge=0.0, le=1.0)


class AgentTelemetry(BaseModel):
    """Telemetry block schema."""
    events: list[str] = Field(default_factory=list)
    risk: AgentTelemetryRisk = Field(default_factory=AgentTelemetryRisk)


class AgentLearning(BaseModel):
    """Learning block schema."""
    fsm_state: str = ""
    level: str = "unknown"
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    micro_fix: list[Any] = Field(default_factory=list)
    mini_practice: Any | None = None


class AgentHandoff(BaseModel):
    """Handoff block schema."""
    to_agent: Literal["none", "BuddyAgent", "TutorAgent", "PlannerAgent", "AssessorAgent"] = "none"


class AgentResponse(BaseModel):
    """Strict schema for agent response."""
    agent: str
    locale: str
    message: str = Field(min_length=1, max_length=4000)
    ui: AgentUI = Field(default_factory=AgentUI)
    learning: AgentLearning = Field(default_factory=AgentLearning)
    telemetry: AgentTelemetry = Field(default_factory=AgentTelemetry)
    handoff: AgentHandoff = Field(default_factory=AgentHandoff)
    
    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        """Ensure message is not empty after strip."""
        if not v.strip():
            raise ValueError("message cannot be empty or whitespace only")
        return v.strip()
    
    @field_validator("agent")
    @classmethod
    def validate_agent(cls, v: str) -> str:
        """Validate agent name."""
        allowed = ["TutorAgent", "BuddyAgent", "PlannerAgent", "AssessorAgent", "OrchestratorAgent"]
        if v not in allowed:
            raise ValueError(f"agent must be one of {allowed}")
        return v
