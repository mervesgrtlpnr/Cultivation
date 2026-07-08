from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import DateTime, Integer, UniqueConstraint, func
from sqlalchemy.dialects.mssql import DATE, DECIMAL, NVARCHAR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("email", name="uq_users_email"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    full_name: Mapped[str] = mapped_column(NVARCHAR(100), nullable=False)
    email: Mapped[str] = mapped_column(NVARCHAR(120), nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(NVARCHAR(None), nullable=False)  # NVARCHAR(MAX)

    birth_date: Mapped[Optional[date]] = mapped_column(DATE, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(NVARCHAR(20), nullable=True)

    weight: Mapped[Optional[float]] = mapped_column(DECIMAL(5, 2), nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.getdate(), nullable=False)

    daily_logs: Mapped[List["DailyLog"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    habits: Mapped[List["Habit"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    mood_records: Mapped[List["MoodRecord"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    health_records: Mapped[List["HealthRecord"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    stats: Mapped[Optional["UserStats"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )

