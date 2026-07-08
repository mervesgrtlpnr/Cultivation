from __future__ import annotations

from typing import List, Optional

from sqlalchemy import Integer
from sqlalchemy.dialects.mssql import NVARCHAR
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.schema import ForeignKey

from .base import Base


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    habit_name: Mapped[str] = mapped_column(NVARCHAR(150), nullable=False)
    frequency: Mapped[Optional[str]] = mapped_column(NVARCHAR(30), nullable=True)  # e.g. daily/weekly
    target_per_week: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    user: Mapped["User"] = relationship(back_populates="habits")
    logs: Mapped[List["HabitLog"]] = relationship(
        back_populates="habit",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

