from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-Agent Agricultural Decision-Support System — Phase 1 MVP",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS (allow Next.js frontend to talk to FastAPI) ──────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# ── Register API Routers (wired in Day 6) ─────────────────────────────────────
# from app.api.v1.decisions import router as decisions_router
# app.include_router(decisions_router, prefix="/api/v1/decisions", tags=["Decisions"])
