from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Course, Lesson, LessonAttempt, Achievement, UserAchievement
from app.schemas import CourseOut, LessonOut, LessonAttemptIn, LessonAttemptOut, QuestionOut
from app.routers.common import get_user_id, ensure_user

router = APIRouter()


def _get_course_progress(db: Session, user_id: str, course: Course) -> tuple[int, int, int]:
    total_lessons = db.query(Lesson).filter(Lesson.course_id == course.id).count()
    completed_lessons = (
        db.query(LessonAttempt.lesson_id)
        .join(Lesson, LessonAttempt.lesson_id == Lesson.id)
        .filter(LessonAttempt.user_id == user_id, Lesson.course_id == course.id)
        .distinct()
        .count()
    )
    progress = int((completed_lessons / total_lessons) * 100) if total_lessons else 0
    return progress, total_lessons, completed_lessons


def _build_lesson_status(lessons: list[Lesson], completed_ids: set[str]) -> list[LessonOut]:
    lesson_out: list[LessonOut] = []
    unlock_next = True
    for lesson in lessons:
        if lesson.id in completed_ids:
            status = "completed"
        else:
            status = "available" if unlock_next else "locked"
            if status == "available":
                unlock_next = False
        lesson_out.append(
            LessonOut(
                id=lesson.id,
                title=lesson.title,
                description="Практика ключевых терминов и рабочих сценариев.",
                type=lesson.type,
                status=status,
            )
        )
    return lesson_out


def _unlock_achievements(db: Session, user_id: str, lesson_id: str) -> None:
    achievements = {a.code: a for a in db.query(Achievement).all()}
    unlocked_ids = {ua.achievement_id for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()}

    attempts_count = db.query(LessonAttempt).filter(LessonAttempt.user_id == user_id).count()

    def unlock(code: str) -> None:
        achievement = achievements.get(code)
        if achievement and achievement.id not in unlocked_ids:
            db.add(UserAchievement(id=str(uuid4()), user_id=user_id, achievement_id=achievement.id))

    if attempts_count >= 1:
        unlock("first_step")
    if attempts_count >= 3:
        unlock("three_sessions")
    if attempts_count >= 7:
        unlock("consistency")

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if lesson:
        course_lessons = db.query(Lesson).filter(Lesson.course_id == lesson.course_id).all()
        course_lesson_ids = [l.id for l in course_lessons]
        completed = (
            db.query(LessonAttempt.lesson_id)
            .filter(LessonAttempt.user_id == user_id, LessonAttempt.lesson_id.in_(course_lesson_ids))
            .distinct()
            .count()
        )
        if completed >= 10:
            unlock("course_finisher")

    db.commit()


@router.get("/courses", response_model=list[CourseOut])
def list_courses(db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    ensure_user(db, user_id)
    courses = db.query(Course).filter(Course.is_active.is_(True)).order_by(Course.title).all()
    result = []
    for course in courses:
        progress, total_lessons, completed_lessons = _get_course_progress(db, user_id, course)
        result.append(
            CourseOut(
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
        )
    return result


@router.get("/courses/{course_id}/lessons", response_model=list[LessonOut])
def list_lessons(course_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    ensure_user(db, user_id)
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    lessons = db.query(Lesson).filter(Lesson.course_id == course_id).order_by(Lesson.order_index).all()
    completed_ids = {
        row.lesson_id
        for row in db.query(LessonAttempt.lesson_id)
        .filter(LessonAttempt.user_id == user_id)
        .all()
    }
    return _build_lesson_status(lessons, completed_ids)


@router.get("/lessons/{lesson_id}", response_model=LessonOut)
def get_lesson(lesson_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    ensure_user(db, user_id)
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    items = (lesson.content_json or {}).get("items", [])
    questions: list[QuestionOut] = []
    for idx, item in enumerate(items):
        options = item.get("options", [])
        correct_index = item.get("correctIndex", 0)
        correct_answer = options[correct_index] if options else ""
        questions.append(
            QuestionOut(
                id=f"{lesson.id}_q{idx + 1}",
                text=item.get("question", ""),
                options=options,
                correctAnswer=correct_answer,
                explanation="Разбор появится после выбора ответа.",
            )
        )

    completed_ids = {
        row.lesson_id
        for row in db.query(LessonAttempt.lesson_id)
        .filter(LessonAttempt.user_id == user_id)
        .all()
    }
    status = "completed" if lesson.id in completed_ids else "available"

    return LessonOut(
        id=lesson.id,
        title=lesson.title,
        description="Практика ключевых терминов и рабочих сценариев.",
        type=lesson.type,
        status=status,
        questions=questions,
    )


@router.post("/lessons/{lesson_id}/attempt", response_model=LessonAttemptOut)
def submit_attempt(
    lesson_id: str,
    payload: LessonAttemptIn,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    ensure_user(db, user_id)
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    attempt_id = str(uuid4())
    attempt = LessonAttempt(
        id=attempt_id,
        user_id=user_id,
        lesson_id=lesson_id,
        score=payload.score,
        answers_json=payload.answers,
        completed_at=datetime.utcnow(),
    )
    db.add(attempt)
    db.commit()

    _unlock_achievements(db, user_id, lesson_id)

    return LessonAttemptOut(
        attempt_id=attempt_id,
        score=payload.score,
        completed_at=attempt.completed_at.isoformat(),
    )
