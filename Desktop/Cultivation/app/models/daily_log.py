from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import Integer, UniqueConstraint
from sqlalchemy.dialects.mssql import DATE, DECIMAL, NVARCHAR
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.schema import ForeignKey

from .base import Base


class DailyLog(Base):
    __tablename__ = "daily_logs"
    __table_args__ = (UniqueConstraint("user_id", "log_date", name="uq_daily_logs_user_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    log_date: Mapped[date] = mapped_column(DATE, nullable=False, index=True)

    notes: Mapped[Optional[str]] = mapped_column(NVARCHAR(None), nullable=True)  # NVARCHAR(MAX)

    study_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    calories_burned: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    water_intake_ml: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    sleep_hours: Mapped[Optional[float]] = mapped_column(DECIMAL(4, 2), nullable=True)
    productivity_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-10

    user: Mapped["User"] = relationship(back_populates="daily_logs")

