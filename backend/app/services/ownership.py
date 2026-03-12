from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.jwt import decode_access_token
from app.db.session import get_db
from app.models.user import User


@dataclass
class RequestOwner:
    user: User | None
    guest_session_id: str | None

    @property
    def is_guest(self) -> bool:
        return self.user is None


def resolve_owner(
    db: Session = Depends(get_db),
    x_guest_session_id: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
) -> RequestOwner:
    # JWT-based auth: Authorization: Bearer <token>
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        try:
            payload = decode_access_token(token)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return RequestOwner(user=user, guest_session_id=None)

    # Guest fallback
    if not x_guest_session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Guest requests must include X-Guest-Session-Id",
        )

    return RequestOwner(user=None, guest_session_id=x_guest_session_id)


def assert_project_access(owner: RequestOwner, project) -> None:
    if owner.user and project.user_id == owner.user.id:
        return
    if owner.guest_session_id and project.guest_session_id == owner.guest_session_id:
        return
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
