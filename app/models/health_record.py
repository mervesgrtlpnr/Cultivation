from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import Integer
from sqlalchemy.dialects.mssql import DATE, NVARCHAR
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.schema import ForeignKey

from .base import Base


class HealthRecord(Base):
    __tablename__ = "health_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    record_type: Mapped[str] = mapped_column(NVARCHAR(50), nullable=False)  # e.g. period, supplement
    start_date: Mapped[Optional[date]] = mapped_column(DATE, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(DATE, nullable=True)

    intensity: Mapped[Optional[str]] = mapped_column(NVARCHAR(30), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(NVARCHAR(None), nullable=True)  # NVARCHAR(MAX)

    user: Mapped["User"] = relationship(back_populates="health_records")

