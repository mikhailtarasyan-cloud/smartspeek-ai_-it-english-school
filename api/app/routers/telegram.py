from datetime import datetime
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models import TelegramLink, UserProfile, Lesson, LessonAttempt, Achievement, UserAchievement
from app.routers.common import ensure_user
from app.routers.courses import _unlock_achievements
from app.routers.progress import _achievement_list

router = APIRouter()


def _get_bot_url(method: str) -> str:
    return f"https://api.telegram.org/bot{settings.telegram_bot_token}/{method}"


def _quick_keyboard() -> dict:
    return {
        "keyboard": [[{"text": "Практика"}, {"text": "Мой план"}, {"text": "Прогресс"}]],
        "resize_keyboard": True,
        "one_time_keyboard": False,
    }


def _send_message(chat_id: str, text: str):
    if not settings.telegram_bot_token:
        return
    payload = {"chat_id": chat_id, "text": text, "reply_markup": _quick_keyboard()}
    with httpx.Client(timeout=5) as client:
        client.post(_get_bot_url("sendMessage"), json=payload)


def _get_or_create_profile(db: Session, user_id: str) -> UserProfile:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id, fsm_state="", level="unknown", preferences_json={})
        db.add(profile)
        db.commit()
    return profile


def _get_next_question(db: Session, profile: UserProfile) -> tuple[Lesson, dict, int]:
    lesson_id = (profile.preferences_json or {}).get("telegram_current_lesson_id")
    question_index = (profile.preferences_json or {}).get("telegram_current_question_index", 0)

    if not lesson_id:
        lesson = db.query(Lesson).order_by(Lesson.order_index).first()
        question_index = 0
    else:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            lesson = db.query(Lesson).order_by(Lesson.order_index).first()
            question_index = 0

    items = (lesson.content_json or {}).get("items", [])
    if not items:
        return lesson, {"question": "Вопрос отсутствует", "options": []}, 0

    if question_index >= len(items):
        question_index = 0

    return lesson, items[question_index], question_index


def _record_telegram_achievement(db: Session, user_id: str):
    achievement = db.query(Achievement).filter(Achievement.code == "telegram_starter").first()
    if not achievement:
        return
    existing = db.query(UserAchievement).filter(
        UserAchievement.user_id == user_id,
        UserAchievement.achievement_id == achievement.id,
    ).first()
    if not existing:
        db.add(UserAchievement(id=str(uuid4()), user_id=user_id, achievement_id=achievement.id))
        db.commit()


@router.post("/telegram/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    update = await request.json()
    message = update.get("message", {})
    chat_id = str(message.get("chat", {}).get("id", ""))
    text = (message.get("text") or "").strip()

    if not chat_id:
        return {"ok": True}

    user_id = "user_demo"
    ensure_user(db, user_id)

    if text.startswith("/start"):
        link = db.query(TelegramLink).filter(TelegramLink.user_id == user_id).first()
        if not link:
            db.add(TelegramLink(user_id=user_id, chat_id=chat_id, linked_at=datetime.utcnow()))
            db.commit()
        _send_message(chat_id, "Связка с аккаунтом создана. Как учиться: выбери режим ниже.")
        return {"ok": True}

    profile = _get_or_create_profile(db, user_id)

    if text.lower() == "мой план":
        _send_message(chat_id, "План на 7 дней: 10 минут в день, чередуем словарь, грамматику и speaking.")
        return {"ok": True}

    if text.lower() == "прогресс":
        achievements = _achievement_list(db, user_id)
        unlocked = len([a for a in achievements if a.status == "unlocked"])
        attempts = db.query(LessonAttempt).filter(LessonAttempt.user_id == user_id).count()
        _send_message(chat_id, f"Попыток: {attempts}. Достижений открыто: {unlocked}.")
        return {"ok": True}

    if text.lower() == "практика":
        lesson, question, index = _get_next_question(db, profile)
        options = question.get("options", [])
        prompt = "\n".join([f"{i+1}. {opt}" for i, opt in enumerate(options)])
        _send_message(chat_id, f"{question.get('question')}\n{prompt}\nОтвет: 1/2/3/4")
        profile.preferences_json = {
            **(profile.preferences_json or {}),
            "telegram_current_lesson_id": lesson.id,
            "telegram_current_question_index": index,
        }
        db.commit()
        return {"ok": True}

    if text in {"1", "2", "3", "4"}:
        lesson, question, index = _get_next_question(db, profile)
        correct_index = question.get("correctIndex", 0)
        selected_index = int(text) - 1
        is_correct = selected_index == correct_index

        db.add(
            LessonAttempt(
                id=str(uuid4()),
                user_id=user_id,
                lesson_id=lesson.id,
                score=1 if is_correct else 0,
                answers_json={"selected": selected_index, "correct": correct_index},
                completed_at=datetime.utcnow(),
            )
        )
        db.commit()
        _unlock_achievements(db, user_id, lesson.id)
        _record_telegram_achievement(db, user_id)

        feedback = "Верно!" if is_correct else "Почти. Попробуй еще раз."
        next_index = index + 1
        profile.preferences_json = {
            **(profile.preferences_json or {}),
            "telegram_current_lesson_id": lesson.id,
            "telegram_current_question_index": next_index,
        }
        db.commit()

        _send_message(chat_id, f"{feedback} Хочешь следующий вопрос? Напиши \"Практика\".")
        return {"ok": True}

    _send_message(chat_id, "Выбери вариант ниже, чтобы продолжить.")
    return {"ok": True}
