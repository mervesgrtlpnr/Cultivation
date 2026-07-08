from __future__ import annotations

from fastapi import FastAPI

from app.db.database import engine
from app.models import Base
from app.api import api_router


def create_app() -> FastAPI:
    app = FastAPI(title="Cultivation API", version="0.1.0")

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.on_event("startup")
    def on_startup() -> None:
        # For initial bootstrap; later consider migrations (Alembic).
        Base.metadata.create_all(bind=engine)

    app.include_router(api_router)

    return app


app = create_app()

