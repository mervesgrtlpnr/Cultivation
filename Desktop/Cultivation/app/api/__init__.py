from __future__ import annotations

from fastapi import APIRouter

from .v1 import auth, daily_logs, moods, users


api_router = APIRouter(prefix="/api")

api_router.include_router(users.router, prefix="/v1", tags=["users"])
api_router.include_router(auth.router, prefix="/v1", tags=["auth"])
api_router.include_router(daily_logs.router, prefix="/v1", tags=["daily_logs"])
api_router.include_router(moods.router, prefix="/v1", tags=["moods"])

