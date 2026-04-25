import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import field_validator
from dotenv import load_dotenv

load_dotenv()

# วิธีที่ปลอดภัยที่สุดสำหรับโปรเจกต์ส่งมอบ: 
# ใช้ Path สัมพัทธ์กับตำแหน่งของไฟล์ config.py นี้เสมอ
BASE_DIR = Path(__file__).resolve().parent.parent

def get_default_database_url() -> str:
    # ฐานข้อมูลอยู่ที่ backend/db/data/carpool.db
    db_path = BASE_DIR / "db" / "data" / "carpool.db"
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{db_path.as_posix()}"

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", get_default_database_url())
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url_value(cls, value: str) -> str:
        if not value:
            return get_default_database_url()
        
        if value.startswith("sqlite:///"):
            path_str = value.replace("sqlite:///", "")
            if not os.path.isabs(path_str):
                # ถ้าเป็น relative path ให้ถือว่าเริ่มจาก BASE_DIR (โฟลเดอร์ backend)
                path_str = (BASE_DIR / path_str).resolve().as_posix()
            
            os.makedirs(os.path.dirname(path_str), exist_ok=True)
            return f"sqlite:///{path_str}"
            
        return value

settings = Settings()
