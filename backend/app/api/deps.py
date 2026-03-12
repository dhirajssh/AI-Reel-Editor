from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.ownership import RequestOwner, resolve_owner


def get_owner(
    db: Session = Depends(get_db),
    owner: RequestOwner = Depends(resolve_owner),
) -> RequestOwner:
    return owner

