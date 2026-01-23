from fastapi import Header
from sqlalchemy.orm import Session

from app.models import User, UserProfile


def get_user_id(x_user_id: str | None = Header(default=None, alias="X-User-Id")) -> str:
    return x_user_id or "user_demo"


def ensure_user(db: Session, user_id: str) -> None:
    if not db.query(User).filter(User.id == user_id).first():
        db.add(User(id=user_id))
        db.add(UserProfile(user_id=user_id, fsm_state="", level="unknown", preferences_json={}))
        db.commit()
