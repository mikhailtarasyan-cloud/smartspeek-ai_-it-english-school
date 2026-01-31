import hashlib
import random
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import GlossaryTopic, GlossaryTerm, GameSession, GameQuestion, GameAnswer, User
from app.schemas import GlossaryTopicOut, GlossaryTopicStats, GameAnswerResponse, GameQuestionOut, GameSessionOut
from app.security import get_current_user

router = APIRouter()

BASE_POINTS = 10


def _multiplier_for_streak(streak: int) -> float:
    if streak >= 10:
        return 2.0
    if streak >= 6:
        return 1.5
    if streak >= 3:
        return 1.2
    return 1.0


def _seed_for(user_id: str, topic_id: str, attempt_no: int) -> str:
    bucket = datetime.utcnow().strftime("%Y-%m-%d")
    raw = f"{user_id}:{topic_id}:{attempt_no}:{bucket}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def _build_questions(db: Session, topic_id: str, n: int, seed: str) -> list[GameQuestion]:
    terms = db.query(GlossaryTerm).filter(GlossaryTerm.topic_id == topic_id).all()
    if len(terms) < 3:
        raise HTTPException(status_code=400, detail="Not enough terms for quiz")

    rng = random.Random(seed)
    rng.shuffle(terms)
    selected = terms[:n]
    other_terms = terms[n:] + selected

    questions: list[GameQuestion] = []
    true_count_target = n // 2
    true_count = 0
    for idx, term in enumerate(selected):
        is_true = true_count < true_count_target and rng.random() > 0.5
        if is_true:
            shown_definition = term.definition
            true_count += 1
        else:
            wrong = rng.choice(other_terms)
            while wrong.id == term.id:
                wrong = rng.choice(other_terms)
            shown_definition = wrong.definition

        explanation = f"Правильный вариант: {term.definition}"
        questions.append(
            GameQuestion(
                id=str(uuid4()),
                session_id="",
                term_id=term.id,
                shown_definition=shown_definition,
                is_true=is_true,
                explanation=explanation,
                icon_key="fa-book-atlas",
                order_index=idx,
            )
        )

    return questions


def _current_question(db: Session, session_id: str, index: int) -> GameQuestion | None:
    return (
        db.query(GameQuestion)
        .filter(GameQuestion.session_id == session_id, GameQuestion.order_index == index)
        .first()
    )


def _to_question_out(db: Session, question: GameQuestion) -> GameQuestionOut:
    term = db.query(GlossaryTerm).filter(GlossaryTerm.id == question.term_id).first()
    return GameQuestionOut(
        id=question.id,
        term=term.term if term else "Term",
        shown_definition=question.shown_definition,
        explanation=question.explanation,
        icon_key=question.icon_key,
        order_index=question.order_index,
    )


@router.get("/minigames/truefalse/topics", response_model=list[GlossaryTopicOut])
def list_topics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [
        GlossaryTopicOut(
            id=t.id,
            slug=t.slug,
            title=t.title,
            description=t.description,
            skill_tag=t.skill_tag,
        )
        for t in db.query(GlossaryTopic).all()
    ]


@router.get("/minigames/truefalse/topics/{topic_id}/stats", response_model=GlossaryTopicStats)
def topic_stats(
    topic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(GameSession)
        .filter(GameSession.user_id == current_user.id, GameSession.topic_id == topic_id)
        .all()
    )
    attempts = len(sessions)
    correct = sum(s.correct_count for s in sessions)
    total = sum(s.correct_count + s.wrong_count for s in sessions) or 1
    accuracy = round((correct / total) * 100, 2)
    best_streak = max([s.streak_max for s in sessions], default=0)
    return GlossaryTopicStats(topic_id=topic_id, attempts=attempts, accuracy=accuracy, best_streak=best_streak)


@router.post("/minigames/truefalse/sessions", response_model=GameSessionOut)
def start_session(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    topic_id = payload.get("topic_id")
    n_questions = int(payload.get("n_questions", 20))
    resume = bool(payload.get("resume", False))
    if not topic_id:
        raise HTTPException(status_code=400, detail="topic_id required")

    if resume:
        active = (
            db.query(GameSession)
            .filter(
                GameSession.user_id == current_user.id,
                GameSession.topic_id == topic_id,
                GameSession.status == "active",
            )
            .order_by(GameSession.created_at.desc())
            .first()
        )
        if active:
            question = _current_question(db, active.id, active.current_index)
            return GameSessionOut(
                id=active.id,
                topic_id=active.topic_id,
                status=active.status,
                n_questions=active.n_questions,
                current_index=active.current_index,
                score_total=active.score_total,
                correct_count=active.correct_count,
                wrong_count=active.wrong_count,
                streak_current=active.streak_current,
                streak_max=active.streak_max,
                attempt_no=active.attempt_no,
                current_question=_to_question_out(db, question) if question else None,
            )

    last_attempt = (
        db.query(GameSession)
        .filter(GameSession.user_id == current_user.id, GameSession.topic_id == topic_id)
        .order_by(GameSession.attempt_no.desc())
        .first()
    )
    attempt_no = (last_attempt.attempt_no + 1) if last_attempt else 1
    seed = _seed_for(current_user.id, topic_id, attempt_no)
    questions = _build_questions(db, topic_id, n_questions, seed)

    session = GameSession(
        id=str(uuid4()),
        user_id=current_user.id,
        topic_id=topic_id,
        mode="true_false",
        n_questions=n_questions,
        status="active",
        current_index=0,
        score_total=0,
        correct_count=0,
        wrong_count=0,
        streak_current=0,
        streak_max=0,
        attempt_no=attempt_no,
        seed=seed,
    )
    db.add(session)
    db.commit()

    for q in questions:
        q.session_id = session.id
        db.add(q)
    db.commit()

    first_question = _current_question(db, session.id, 0)
    return GameSessionOut(
        id=session.id,
        topic_id=session.topic_id,
        status=session.status,
        n_questions=session.n_questions,
        current_index=session.current_index,
        score_total=session.score_total,
        correct_count=session.correct_count,
        wrong_count=session.wrong_count,
        streak_current=session.streak_current,
        streak_max=session.streak_max,
        attempt_no=session.attempt_no,
        current_question=_to_question_out(db, first_question) if first_question else None,
    )


@router.get("/minigames/truefalse/sessions/{session_id}", response_model=GameSessionOut)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    question = _current_question(db, session.id, session.current_index)
    return GameSessionOut(
        id=session.id,
        topic_id=session.topic_id,
        status=session.status,
        n_questions=session.n_questions,
        current_index=session.current_index,
        score_total=session.score_total,
        correct_count=session.correct_count,
        wrong_count=session.wrong_count,
        streak_current=session.streak_current,
        streak_max=session.streak_max,
        attempt_no=session.attempt_no,
        current_question=_to_question_out(db, question) if question else None,
    )


@router.post("/minigames/truefalse/sessions/{session_id}/answer", response_model=GameAnswerResponse)
def answer_session(
    session_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )
    if not session or session.status != "active":
        raise HTTPException(status_code=404, detail="Session not active")

    question_id = payload.get("question_id")
    user_answer = payload.get("user_answer")
    response_time_ms = payload.get("response_time_ms")
    if question_id is None or user_answer is None:
        raise HTTPException(status_code=400, detail="question_id and user_answer required")

    question = db.query(GameQuestion).filter(GameQuestion.id == question_id).first()
    if not question or question.session_id != session.id:
        raise HTTPException(status_code=404, detail="Question not found")

    is_correct = bool(user_answer) == bool(question.is_true)
    multiplier = _multiplier_for_streak(session.streak_current)
    if is_correct:
        score_delta = round(BASE_POINTS * multiplier)
        session.streak_current += 1
        session.streak_max = max(session.streak_max, session.streak_current)
        session.correct_count += 1
    else:
        score_delta = 0
        session.streak_current = 0
        session.wrong_count += 1

    session.score_total += score_delta
    session.updated_at = datetime.utcnow()

    answer = GameAnswer(
        id=str(uuid4()),
        session_id=session.id,
        question_id=question.id,
        user_answer=bool(user_answer),
        is_correct=is_correct,
        score_delta=score_delta,
        multiplier=multiplier,
        streak_after=session.streak_current,
        response_time_ms=response_time_ms if response_time_ms is not None else None,
    )
    db.add(answer)
    db.commit()

    return GameAnswerResponse(
        is_correct=is_correct,
        score_delta=score_delta,
        score_total=session.score_total,
        streak_current=session.streak_current,
        streak_max=session.streak_max,
        multiplier=multiplier,
        explanation=question.explanation,
        correct_answer=question.is_true,
    )


@router.get("/minigames/truefalse/sessions/{session_id}/next", response_model=GameSessionOut)
def next_question(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.current_index += 1
    if session.current_index >= session.n_questions:
        session.status = "finished"
        db.commit()
        return GameSessionOut(
            id=session.id,
            topic_id=session.topic_id,
            status=session.status,
            n_questions=session.n_questions,
            current_index=session.current_index,
            score_total=session.score_total,
            correct_count=session.correct_count,
            wrong_count=session.wrong_count,
            streak_current=session.streak_current,
            streak_max=session.streak_max,
            attempt_no=session.attempt_no,
            current_question=None,
        )

    db.commit()
    question = _current_question(db, session.id, session.current_index)
    return GameSessionOut(
        id=session.id,
        topic_id=session.topic_id,
        status=session.status,
        n_questions=session.n_questions,
        current_index=session.current_index,
        score_total=session.score_total,
        correct_count=session.correct_count,
        wrong_count=session.wrong_count,
        streak_current=session.streak_current,
        streak_max=session.streak_max,
        attempt_no=session.attempt_no,
        current_question=_to_question_out(db, question) if question else None,
    )


@router.post("/minigames/truefalse/sessions/{session_id}/restart", response_model=GameSessionOut)
def restart_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "abandoned"
    db.commit()

    return start_session({"topic_id": session.topic_id, "n_questions": session.n_questions, "resume": False}, db, current_user)
