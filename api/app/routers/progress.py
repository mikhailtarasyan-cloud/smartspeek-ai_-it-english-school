from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Course, Lesson, LessonAttempt, Achievement, UserAchievement, User
from app.schemas import ProgressOut, CourseOut, AchievementOut
from app.routers.common import ensure_user
from app.security import get_current_user

router = APIRouter()


def _course_progress(db: Session, user_id: str, course: Course) -> CourseOut:
    total_lessons = db.query(Lesson).filter(Lesson.course_id == course.id).count()
    completed_lessons = (
        db.query(LessonAttempt.lesson_id)
        .join(Lesson, LessonAttempt.lesson_id == Lesson.id)
        .filter(LessonAttempt.user_id == user_id, Lesson.course_id == course.id)
        .distinct()
        .count()
    )
    progress = int((completed_lessons / total_lessons) * 100) if total_lessons else 0
    return CourseOut(
        id=course.id,
        name=course.title,
        description=course.description,
        progress=progress,
        totalLessons=total_lessons,
        completedLessons=completed_lessons,
        color=course.color or "#2563EB",
        icon=course.icon or "fa-book",
        lessons=None,
    )


def _achievement_list(db: Session, user_id: str) -> list[AchievementOut]:
    achievements = db.query(Achievement).all()
    unlocked = {
        ua.achievement_id: ua.unlocked_at
        for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
    }
    results: list[AchievementOut] = []
    for achievement in achievements:
        unlocked_at = unlocked.get(achievement.id)
        results.append(
            AchievementOut(
                id=achievement.id,
                title=achievement.title,
                description=achievement.description,
                icon=achievement.icon or "fa-star",
                status="unlocked" if unlocked_at else "locked",
                date=unlocked_at.isoformat() if unlocked_at else None,
                type=achievement.type or "skill",
                tier=achievement.tier,
            )
        )
    return results


@router.get("/progress", response_model=ProgressOut)
def get_progress(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    ensure_user(db, user_id)
    courses = db.query(Course).filter(Course.is_active.is_(True)).order_by(Course.title).all()
    course_out = [_course_progress(db, user_id, course) for course in courses]
    achievements = _achievement_list(db, user_id)
    total_attempts = db.query(LessonAttempt).filter(LessonAttempt.user_id == user_id).count()

    return ProgressOut(
        courses=course_out,
        achievements=achievements,
        total_attempts=total_attempts,
    )
