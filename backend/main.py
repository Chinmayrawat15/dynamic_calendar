from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db
from backend.routers import activity, predictions, stats, settings, chat, calendar
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FocusFlow Backend")

# CORS
origins = [
    "http://localhost:3000", # Frontend
    "chrome-extension://*", # Chrome Extension (needs specific ID in production)
    "*" # Allow all for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(activity.router, prefix="/api", tags=["Activity"])
app.include_router(predictions.router, prefix="/api", tags=["Predictions"])
app.include_router(stats.router, prefix="/api", tags=["Stats"])
app.include_router(settings.router, prefix="/api", tags=["Settings"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(calendar.router, prefix="/api", tags=["Calendar"])

@app.on_event("startup")
def on_startup():
    logger.info("Initializing Database...")
    init_db()
    logger.info("Database initialized.")

@app.get("/")
def read_root():
    return {"message": "FocusFlow Backend Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
