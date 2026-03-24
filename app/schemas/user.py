from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserPublic(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    birth_date: date | None = None
    gender: str | None = None
    weight: Decimal | None = None
    height: int | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    birth_date: date | None = None
    gender: str | None = Field(default=None, max_length=20)
    weight: Decimal | None = None
    height: int | None = None

