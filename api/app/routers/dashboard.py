from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Course, LessonAttempt
from app.schemas import DashboardOut
from app.routers.common import get_user_id, ensure_user
from app.routers.progress import _course_progress, _achievement_list

router = APIRouter()


@router.get("/dashboard", response_model=DashboardOut)
def get_dashboard(db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    ensure_user(db, user_id)
    courses = db.query(Course).filter(Course.is_active.is_(True)).order_by(Course.title).all()
    course_out = [_course_progress(db, user_id, course) for course in courses]
    achievements = _achievement_list(db, user_id)

    active_courses = len(courses)
    words_learned = max(100, len(courses) * 120)
    level = "B1"

    attempts = db.query(LessonAttempt).filter(LessonAttempt.user_id == user_id).count()
    skill_tree = {
        "name": "SmartSpeek Profile",
        "value": 100,
        "children": [
            {"name": "Grammar", "value": min(100, 40 + attempts * 2)},
            {"name": "Speaking", "value": min(100, 45 + attempts * 2)},
            {"name": "Vocabulary", "value": min(100, 60 + attempts * 2)},
            {"name": "Listening", "value": min(100, 50 + attempts * 2)},
            {"name": "Writing", "value": min(100, 35 + attempts * 2)},
        ],
    }

    return DashboardOut(
        active_courses=active_courses,
        words_learned=words_learned,
        level=level,
        courses=course_out,
        achievements=achievements,
        skill_tree=skill_tree,
    )
