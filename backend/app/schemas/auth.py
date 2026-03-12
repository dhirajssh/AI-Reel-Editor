from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.schemas.common import ORMModel


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: "UserProfileResponse"


class UserProfileResponse(ORMModel):
    id: int
    email: str
    name: str
    created_at: datetime


AuthResponse.model_rebuild()
