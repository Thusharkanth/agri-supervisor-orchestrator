import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.services.db import init_db
from app.api.v1.decisions import router as decisions_router
from app.api.v1.telemetry import router as telemetry_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("agri.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("Starting Multi-Agent Agricultural Decision-Support System...")
    # Initialize DB tables on startup
    await init_db()
    yield
    logger.info("Shutting down Multi-Agent Agricultural Decision-Support System...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Industrial-grade Multi-Agent Agricultural Advisory System orchestrated with "
        "LangGraph (Parallel Fan-Out → Fan-In), FastAPI, PostgreSQL 16, and Redis 7."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS (allow Next.js frontend to talk to FastAPI) ──────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# ── Static Dashboard Route ───────────────────────────────────────────────────
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", tags=["Dashboard"], include_in_schema=False)
async def serve_dashboard():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"status": "ok", "message": "AgriDecision API Gateway is running. Visit /docs for OpenAPI specs."}

# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# ── Register API Routers ───────────────────────────────────────────────────────
app.include_router(decisions_router, prefix="/api/v1/decisions", tags=["Decisions"])
app.include_router(telemetry_router, prefix="/api/v1/telemetry", tags=["Telemetry"])
