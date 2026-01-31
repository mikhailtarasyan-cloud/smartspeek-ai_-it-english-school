from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, JSON, Text, Float, func

from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)
    name = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserProfile(Base):
    __tablename__ = "user_profile"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    fsm_state = Column(String, nullable=True)
    level = Column(String, nullable=True)
    preferences_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Course(Base):
    __tablename__ = "courses"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    domain = Column(String, nullable=True)
    level = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    color = Column(String, nullable=True)
    icon = Column(String, nullable=True)


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(String, primary_key=True)
    course_id = Column(String, ForeignKey("courses.id"), index=True, nullable=False)
    title = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False)
    type = Column(String, nullable=False)
    content_json = Column(JSON, nullable=True)


class LessonAttempt(Base):
    __tablename__ = "lesson_attempts"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    lesson_id = Column(String, ForeignKey("lessons.id"), index=True, nullable=False)
    score = Column(Integer, nullable=True)
    answers_json = Column(JSON, nullable=True)
    completed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(String, primary_key=True)
    code = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    tier = Column(Integer, nullable=False)
    rule_json = Column(JSON, nullable=True)
    icon = Column(String, nullable=True)
    type = Column(String, nullable=True)


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    achievement_id = Column(String, ForeignKey("achievements.id"), index=True, nullable=False)
    unlocked_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class OrchestratorLog(Base):
    __tablename__ = "orchestrator_logs"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    input_json = Column(JSON, nullable=True)
    output_json = Column(JSON, nullable=True)
    risk_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class LearningPlan(Base):
    __tablename__ = "learning_plans"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    plan_length = Column(Integer, nullable=False)
    cefr_level = Column(String, nullable=False)
    goals_json = Column(JSON, nullable=True)
    role = Column(String, nullable=True)
    interests_json = Column(JSON, nullable=True)
    persona_json = Column(JSON, nullable=True)
    status = Column(String, nullable=False, default="active")
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class LearningPlanLesson(Base):
    __tablename__ = "learning_plan_lessons"

    id = Column(String, primary_key=True)
    plan_id = Column(String, ForeignKey("learning_plans.id"), index=True, nullable=False)
    lesson_index = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    focus_programs_json = Column(JSON, nullable=True)
    lesson_payload_json = Column(JSON, nullable=True)
    status = Column(String, nullable=False, default="locked")
    score = Column(Integer, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)


class TelegramLink(Base):
    __tablename__ = "telegram_links"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    chat_id = Column(String, unique=True, nullable=False, index=True)
    linked_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class GlossaryTopic(Base):
    __tablename__ = "glossary_topics"

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    skill_tag = Column(String, nullable=True)


class GlossaryTerm(Base):
    __tablename__ = "glossary_terms"

    id = Column(String, primary_key=True)
    topic_id = Column(String, ForeignKey("glossary_topics.id"), index=True, nullable=False)
    term = Column(String, nullable=False)
    definition = Column(Text, nullable=False)
    difficulty = Column(String, nullable=True)
    tags = Column(JSON, nullable=True)


class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    topic_id = Column(String, ForeignKey("glossary_topics.id"), index=True, nullable=False)
    mode = Column(String, nullable=False, default="true_false")
    n_questions = Column(Integer, nullable=False, default=20)
    status = Column(String, nullable=False, default="active")
    current_index = Column(Integer, nullable=False, default=0)
    score_total = Column(Integer, nullable=False, default=0)
    correct_count = Column(Integer, nullable=False, default=0)
    wrong_count = Column(Integer, nullable=False, default=0)
    streak_current = Column(Integer, nullable=False, default=0)
    streak_max = Column(Integer, nullable=False, default=0)
    attempt_no = Column(Integer, nullable=False, default=1)
    seed = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class GameQuestion(Base):
    __tablename__ = "game_questions"

    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("game_sessions.id"), index=True, nullable=False)
    term_id = Column(String, ForeignKey("glossary_terms.id"), index=True, nullable=False)
    shown_definition = Column(Text, nullable=False)
    is_true = Column(Boolean, nullable=False, default=False)
    explanation = Column(Text, nullable=False)
    icon_key = Column(String, nullable=True)
    order_index = Column(Integer, nullable=False)


class GameAnswer(Base):
    __tablename__ = "game_answers"

    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("game_sessions.id"), index=True, nullable=False)
    question_id = Column(String, ForeignKey("game_questions.id"), index=True, nullable=False)
    user_answer = Column(Boolean, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    score_delta = Column(Integer, nullable=False)
    multiplier = Column(Float, nullable=False)
    streak_after = Column(Integer, nullable=False)
    response_time_ms = Column(Integer, nullable=True)
    answered_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
