import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # Supabase Settings
    SUPABASE_URL: str = "https://tmidlllhzfshqimgounn.supabase.co"
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = "sb_publishable_doEIw7haVDUtC09jk26Aig_gfI9zbKt"

    # Groq API Settings
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "qwen/qwen3.8-27b"

    # Embeddings & Retrieval Settings
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    SIMILARITY_THRESHOLD: float = 0.40
    TOP_K: int = 5

    # Server Settings
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
