"""
FocusFlow Backend - Main FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import settings
from database import init_db
from routers import activity, chat, predictions, calendar_routes, stats, settings as settings_router

# Initialize FastAPI app
app = FastAPI(
    title="FocusFlow API",
    description="Productivity tracking with AI-powered predictions",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "chrome-extension://*",
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(activity.router, prefix="/api", tags=["Activity"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(predictions.router, prefix="/api", tags=["Predictions"])
app.include_router(calendar_routes.router, prefix="/api", tags=["Calendar"])
app.include_router(stats.router, prefix="/api", tags=["Stats"])
app.include_router(settings_router.router, prefix="/api", tags=["Settings"])


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()
    print("✅ FocusFlow API started")
    print(f"📚 Docs available at http://localhost:{settings.backend_port}/docs")
    print(f"➡️  Click here! http://localhost:8000/api/calendar/auth")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "FocusFlow API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
        "ollama": "not_checked",  # TODO: Check Ollama connection
        "keywords_ai": "not_checked"  # TODO: Check Keywords AI connection
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=settings.debug
    )
