from __future__ import annotations

from datetime import date
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import DailyLog


router = APIRouter()


@router.get("/daily-logs", response_model=list[dict])
def list_daily_logs(
    user_id: int,
    log_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> List[dict]:
    query = db.query(DailyLog).filter(DailyLog.user_id == user_id)
    if log_date is not None:
        query = query.filter(DailyLog.log_date == log_date)

    logs = query.all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "log_date": l.log_date,
            "notes": l.notes,
        }
        for l in logs
    ]

