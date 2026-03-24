from __future__ import annotations

from typing import Generator

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CULTIVATION_", env_file=".env", extra="ignore")

    # Required by prompt
    mssql_server: str = "localhost"
    mssql_database: str = "CultivationDB"
    mssql_driver: str = "ODBC Driver 17 for SQL Server"

    # Auth via Windows/SQL login; default to trusted connection for localhost dev.
    mssql_trusted_connection: bool = True
    mssql_username: str | None = None
    mssql_password: str | None = None

    sqlalchemy_echo: bool = False

    def sqlalchemy_url(self) -> str:
        driver = self.mssql_driver.replace(" ", "+")

        if self.mssql_trusted_connection:
            # Integrated Security (typical local dev)
            return (
                "mssql+pyodbc://@"
                f"{self.mssql_server}/{self.mssql_database}"
                f"?driver={driver}&Trusted_Connection=yes&TrustServerCertificate=yes"
            )

        if not self.mssql_username or not self.mssql_password:
            raise ValueError("SQL auth requires CULTIVATION_MSSQL_USERNAME and CULTIVATION_MSSQL_PASSWORD.")

        return (
            "mssql+pyodbc://"
            f"{self.mssql_username}:{self.mssql_password}"
            f"@{self.mssql_server}/{self.mssql_database}"
            f"?driver={driver}&TrustServerCertificate=yes"
        )


settings = Settings()


def get_engine() -> Engine:
    return create_engine(settings.sqlalchemy_url(), echo=settings.sqlalchemy_echo, future=True, pool_pre_ping=True)


engine = get_engine()

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, class_=Session)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

