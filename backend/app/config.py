import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import field_validator
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[2]


def get_default_database_url() -> str:
    db_path = BASE_DIR / "db" / "data" / "carpool.db"
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{db_path.as_posix()}"


def normalize_database_url(raw_url: str | None) -> str:
    if not raw_url:
        return get_default_database_url()

    sqlite_prefix = "sqlite:///"
    if not raw_url.startswith(sqlite_prefix):
        return raw_url

    raw_path = raw_url[len(sqlite_prefix):]
    db_path = Path(raw_path)
    if not db_path.is_absolute():
        db_path = (BASE_DIR / db_path).resolve()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return f"{sqlite_prefix}{db_path.as_posix()}"

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", get_default_database_url())
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url_value(cls, value: str) -> str:
        return normalize_database_url(value)

settings = Settings()
