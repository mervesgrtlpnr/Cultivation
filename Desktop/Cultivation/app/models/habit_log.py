from __future__ import annotations

from datetime import date

from sqlalchemy import Integer, UniqueConstraint
from sqlalchemy.dialects.mssql import BIT, DATE
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.schema import ForeignKey

from .base import Base


class HabitLog(Base):
    __tablename__ = "habit_logs"
    __table_args__ = (UniqueConstraint("habit_id", "log_date", name="uq_habit_logs_habit_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    habit_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    log_date: Mapped[date] = mapped_column(DATE, nullable=False, index=True)
    is_completed: Mapped[bool] = mapped_column(BIT, nullable=False, default=False)

    habit: Mapped["Habit"] = relationship(back_populates="logs")

