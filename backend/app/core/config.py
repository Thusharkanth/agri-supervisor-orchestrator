from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Application ───────────────────────────────────────────────────────────
    APP_NAME: str = "Agri Decision-Support System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # ── PostgreSQL ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://agri_user:agri_pass@localhost:5432/agri_db"

    # ── Redis ──────────────────────────────────────────────────────────────────
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_TTL_SECONDS: int = 3600

    # ── Ollama LLM (Coordinator) ───────────────────────────────────────────────
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"

    # ── Open-Meteo ─────────────────────────────────────────────────────────────
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance (loaded once at startup)."""
    return Settings()


settings = get_settings()
