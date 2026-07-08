from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models import User
from app.schemas import UserProfileUpdate, UserPublic


router = APIRouter()


@router.get("/users", response_model=list[dict])
def list_users(db: Session = Depends(get_db)) -> List[dict]:
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
        }
        for u in users
    ]


@router.get("/users/me", response_model=UserPublic)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.put("/users/me", response_model=UserPublic)
def update_me(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(current_user, key, value)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

