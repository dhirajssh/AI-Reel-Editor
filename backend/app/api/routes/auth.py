from __future__ import annotations

import bcrypt
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.jwt import create_access_token, decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserProfileResponse


router = APIRouter(prefix="/auth", tags=["auth"])


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _get_current_user(db: Session, token: str) -> User:
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters",
        )

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=payload.email,
        name=payload.name,
        password_hash=_hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)
    return AuthResponse(
        token=token,
        user=UserProfileResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not _verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id, user.email)
    return AuthResponse(
        token=token,
        user=UserProfileResponse.model_validate(user),
    )


@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(
    db: Session = Depends(get_db),
    authorization: str = Header(..., alias="Authorization"),
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")
    token = authorization[7:]
    user = _get_current_user(db, token)
    return UserProfileResponse.model_validate(user)


@router.delete("/account")
def delete_account(
    db: Session = Depends(get_db),
    authorization: str = Header(..., alias="Authorization"),
):
    """Permanently delete the authenticated user's account and all their data."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")
    token = authorization[7:]
    user = _get_current_user(db, token)

    # Import here to avoid circular imports
    from app.models.project import Project
    from app.models.job import Job
    from app.models.transcript import Transcript
    from app.services.storage import clean_project_files

    # Delete all user's projects and associated data
    projects = db.query(Project).filter(Project.user_id == user.id).all()
    for project in projects:
        # Delete jobs and transcripts
        db.query(Job).filter(Job.project_id == project.id).delete()
        db.query(Transcript).filter(Transcript.project_id == project.id).delete()
        # Clean up files from disk
        try:
            clean_project_files(project.id)
        except Exception:
            pass  # Best-effort cleanup
        db.delete(project)

    # Delete the user
    db.delete(user)
    db.commit()

    return {"detail": "Account deleted successfully"}
