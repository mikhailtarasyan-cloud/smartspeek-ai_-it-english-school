from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, JSON, Text, func

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


class TelegramLink(Base):
    __tablename__ = "telegram_links"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    chat_id = Column(String, unique=True, nullable=False, index=True)
    linked_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
