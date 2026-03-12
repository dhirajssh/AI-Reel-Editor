from datetime import datetime

from app.schemas.common import ORMModel


class UserResponse(ORMModel):
    id: int
    clerk_user_id: str
    email: str
    created_at: datetime

