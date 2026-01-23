from typing import Any, Literal
from pydantic import BaseModel, Field, EmailStr


class UIAction(BaseModel):
    type: str
    payload: dict[str, Any] = Field(default_factory=dict)


class UIBlock(BaseModel):
    suggestions: list[str] = Field(default_factory=list)
    quick_replies: list[str] = Field(default_factory=list)
    actions: list[UIAction] = Field(default_factory=list)


class RiskBlock(BaseModel):
    blocked: bool = False
    level: Literal["low", "medium", "high"] = "low"
    flags: list[str] = Field(default_factory=list)
    notes: str = ""


class TelemetryBlock(BaseModel):
    events: list[str] = Field(default_factory=list)
    risk: RiskBlock = Field(default_factory=RiskBlock)


class LearningBlock(BaseModel):
    fsm_state: str = ""
    level: str = "unknown"
    confidence_score: float = 0.0
    micro_fix: list[Any] = Field(default_factory=list)
    mini_practice: Any | None = None


class HandoffBlock(BaseModel):
    to_agent: Literal["none", "BuddyAgent"] = "none"


class OrchestratorResponse(BaseModel):
    agent: str
    locale: str
    message: str
    ui: UIBlock
    learning: LearningBlock
    telemetry: TelemetryBlock
    handoff: HandoffBlock


class OrchestratorRequest(BaseModel):
    user_id: str
    locale: str = "ru"
    fsm_state: str = ""
    last_user_message: str
    context: dict[str, Any] | None = None


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    avatar: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    avatar: str | None = None


class QuestionOut(BaseModel):
    id: str
    text: str
    options: list[str]
    correctAnswer: str
    explanation: str


class LessonOut(BaseModel):
    id: str
    title: str
    description: str
    type: str
    status: Literal["locked", "available", "completed"]
    questions: list[QuestionOut] | None = None


class CourseOut(BaseModel):
    id: str
    name: str
    description: str
    progress: int
    totalLessons: int
    completedLessons: int
    color: str
    icon: str
    lessons: list[LessonOut] | None = None


class LessonAttemptIn(BaseModel):
    score: int
    answers: list[Any]


class LessonAttemptOut(BaseModel):
    attempt_id: str
    score: int
    completed_at: str


class AchievementOut(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    status: Literal["locked", "unlocked"]
    date: str | None = None
    type: str
    tier: int


class DashboardOut(BaseModel):
    active_courses: int
    words_learned: int
    level: str
    courses: list[CourseOut]
    achievements: list[AchievementOut]
    skill_tree: dict[str, Any]


class ProgressOut(BaseModel):
    courses: list[CourseOut]
    achievements: list[AchievementOut]
    total_attempts: int
