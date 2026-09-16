from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Application ───────────────────────────────────────────────────────────
    APP_NAME: str = "Agri Decision-Support System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # ── PostgreSQL (individual fields + composed URL) ──────────────────────────
    POSTGRES_USER: str = "agri_user"
    POSTGRES_PASSWORD: str = "agri_pass"
    POSTGRES_DB: str = "agri_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 6543
    DATABASE_URL: str = "postgresql+asyncpg://agri_user:agri_pass@localhost:6543/agri_db"

    # ── Redis ──────────────────────────────────────────────────────────────────
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_TTL_SECONDS: int = 3600

    # ── Ollama LLM (Coordinator) ───────────────────────────────────────────────
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"

    # ── Open-Meteo ─────────────────────────────────────────────────────────────
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    OPEN_METEO_SOIL_URL: str = "https://api.open-meteo.com/v1/forecast"

    # ── LangSmith Tracing & Observability ──────────────────────────────────────
    LANGCHAIN_TRACING_V2: str = "false"
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_PROJECT: str = "agri-decision-support"
    LANGCHAIN_ENDPOINT: str = "https://api.smith.langchain.com"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",  # Silently ignore any unrecognised .env fields
    }


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance and sync LangSmith environment variables."""
    import os
    s = Settings()
    if s.LANGCHAIN_API_KEY:
        os.environ["LANGCHAIN_TRACING_V2"] = s.LANGCHAIN_TRACING_V2
        os.environ["LANGCHAIN_API_KEY"] = s.LANGCHAIN_API_KEY
        os.environ["LANGCHAIN_PROJECT"] = s.LANGCHAIN_PROJECT
        os.environ["LANGCHAIN_ENDPOINT"] = s.LANGCHAIN_ENDPOINT
        os.environ["LANGSMITH_TRACING"] = "true"
        os.environ["LANGSMITH_API_KEY"] = s.LANGCHAIN_API_KEY
        os.environ["LANGSMITH_PROJECT"] = s.LANGCHAIN_PROJECT
        os.environ["LANGSMITH_ENDPOINT"] = s.LANGCHAIN_ENDPOINT
    return s


settings = get_settings()

