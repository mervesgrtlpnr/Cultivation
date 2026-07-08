from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import User


class SecuritySettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CULTIVATION_", env_file=".env", extra="ignore")

    jwt_secret_key: str = "CHANGE_ME"  # override via env in real deployments
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30


security_settings = SecuritySettings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None, extra_claims: Optional[dict[str, Any]] = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=security_settings.jwt_access_token_expire_minutes)
    )

    to_encode: dict[str, Any] = {"sub": subject, "iat": int(now.timestamp()), "exp": expire}
    if extra_claims:
        to_encode.update(extra_claims)

    return jwt.encode(to_encode, security_settings.jwt_secret_key, algorithm=security_settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            security_settings.jwt_secret_key,
            algorithms=[security_settings.jwt_algorithm],
            options={"verify_aud": False},
        )
    except JWTError as exc:
        raise ValueError("Invalid token") from exc

    sub = payload.get("sub")
    if not sub:
        raise ValueError("Token missing subject")

    return payload


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.get(User, user_id)
    if user is None:
        raise credentials_exception
    return user

