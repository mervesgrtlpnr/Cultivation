from __future__ import annotations

from datetime import date
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import MoodRecord


router = APIRouter()


@router.get("/moods", response_model=list[dict])
def list_moods(
    user_id: int,
    record_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> List[dict]:
    query = db.query(MoodRecord).filter(MoodRecord.user_id == user_id)
    if record_date is not None:
        query = query.filter(MoodRecord.record_date == record_date)

    moods = query.all()
    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "mood_tag": m.mood_tag,
            "mood_score": m.mood_score,
            "record_date": m.record_date,
        }
        for m in moods
    ]

