import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.db.models import Base

logger = logging.getLogger("agri.db")

PRIMARY_URL = settings.DATABASE_URL
FALLBACK_URL = "sqlite+aiosqlite:///agri_audit.db"

engine = create_async_engine(
    PRIMARY_URL,
    echo=False,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db() -> bool:
    """Initialize database tables on startup. Falls back to SQLite if PostgreSQL container is offline."""
    global engine, AsyncSessionLocal
    try:
        logger.info(f"Attempting PostgreSQL connection ({settings.POSTGRES_HOST}:{settings.POSTGRES_PORT})...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("PostgreSQL database connected and tables verified.")
        return True
    except Exception as exc:
        logger.warning(
            f"PostgreSQL unavailable ({exc}). Initializing local SQLite fallback engine ({FALLBACK_URL})."
        )
        try:
            engine = create_async_engine(FALLBACK_URL, echo=False)
            AsyncSessionLocal = async_sessionmaker(
                bind=engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autocommit=False,
                autoflush=False,
            )
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Local SQLite database initialized successfully.")
            return True
        except Exception as sqlite_exc:
            logger.error(f"Failed to initialize database fallback: {sqlite_exc}")
            return False


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for obtaining an active database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
