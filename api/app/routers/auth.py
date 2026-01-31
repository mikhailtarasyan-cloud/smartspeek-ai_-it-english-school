from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, UserProfile
from app.schemas import RegisterRequest, LoginRequest, AuthResponse, UserOut
from app.security import create_access_token


router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def _build_auth_response(user: User) -> AuthResponse:
    access_token = create_access_token({"sub": user.id})
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut(
            id=user.id,
            email=user.email,
            name=user.name or "",
            avatar=user.avatar,
        ),
    )


@router.post("/auth/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"detail": "USER_ALREADY_EXISTS", "message": "Пользователь с таким email уже зарегистрирован"},
        )

    user_id = str(uuid4())
    user = User(
        id=user_id,
        email=payload.email,
        password_hash=_hash_password(payload.password),
        name=payload.name.strip(),
        avatar=payload.avatar,
    )
    profile = UserProfile(user_id=user_id, fsm_state="", level="unknown", preferences_json={})

    db.add(user)
    db.add(profile)
    db.commit()

    return _build_auth_response(user)


@router.post("/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "INVALID_CREDENTIALS", "message": "Неверный логин или пароль"},
        )

    if not _verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "INVALID_CREDENTIALS", "message": "Неверный логин или пароль"},
        )

    return _build_auth_response(user)
