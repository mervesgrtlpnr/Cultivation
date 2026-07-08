from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import Integer
from sqlalchemy.dialects.mssql import DATE, NVARCHAR
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.schema import ForeignKey

from .base import Base


class MoodRecord(Base):
    __tablename__ = "mood_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    mood_tag: Mapped[Optional[str]] = mapped_column(NVARCHAR(50), nullable=True)
    mood_score: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-10
    record_date: Mapped[date] = mapped_column(DATE, nullable=False, index=True)

    user: Mapped["User"] = relationship(back_populates="mood_records")

