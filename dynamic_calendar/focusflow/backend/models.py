"""
Pydantic models for request/response validation.
These define the API contract between frontend/extension and backend.
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


# ============================================================
# Activity Models (Extension → Backend)
# ============================================================

class ActivityItem(BaseModel):
    """Single activity record from the extension."""
    url: str
    domain: str
    title: str
    duration_ms: int = Field(ge=0)
    start_time: int  # Unix timestamp ms
    end_time: int    # Unix timestamp ms


class ActivityRequest(BaseModel):
    """Batch of activities sent from extension."""
    task_name: str
    activities: list[ActivityItem]
    tab_switches: int = Field(ge=0)
    focus_score: float = Field(ge=0, le=100)


class ActivityResponse(BaseModel):
    """Response after logging activities."""
    status: Literal["logged"]
    count: int


# ============================================================
# Chat Models (Frontend → Backend → Keywords AI)
# ============================================================

class ChatContext(BaseModel):
    """Context provided with chat messages."""
    current_task: Optional[str] = None
    conservativity: float = Field(default=0.5, ge=0, le=1)


class ChatRequest(BaseModel):
    """Chat message from frontend."""
    message: str
    context: ChatContext = ChatContext()


class ChatResponse(BaseModel):
    """Chat response from AI."""
    response: str
    suggestions: Optional[list[str]] = None


# ============================================================
# Prediction Models
# ============================================================

class PredictionResponse(BaseModel):
    """Task duration prediction."""
    predicted_minutes: int
    confidence: Literal["low", "medium", "high"]
    based_on_sessions: int
    explanation: str


# ============================================================
# Stats Models
# ============================================================

class StatsResponse(BaseModel):
    """Dashboard statistics."""
    today_focus_score: float
    hours_tracked_today: float
    prediction_accuracy_percent: float
    total_sessions: int


# ============================================================
# Calendar Models
# ============================================================

class CalendarEvent(BaseModel):
    """Calendar event with optional prediction."""
    id: str
    title: str
    start: str  # ISO format
    end: str    # ISO format
    predicted_duration: Optional[int] = None  # minutes


class CalendarEventsResponse(BaseModel):
    """List of calendar events."""
    events: list[CalendarEvent]


class CreateEventRequest(BaseModel):
    """Request to create a calendar event."""
    title: str
    start: str  # ISO format
    end: str    # ISO format
    time_zone: Optional[str] = None  # IANA timezone, e.g. "America/New_York"
    description: Optional[str] = None


class CreateEventResponse(BaseModel):
    """Response after creating an event."""
    event_id: str
    url: str


# ============================================================
# Settings Models
# ============================================================

class SettingsResponse(BaseModel):
    """User settings."""
    conservativity: float
    tracked_sites: list[str]


class SettingsUpdateRequest(BaseModel):
    """Request to update settings."""
    conservativity: Optional[float] = Field(default=None, ge=0, le=1)
    tracked_sites: Optional[list[str]] = None


class SettingsUpdateResponse(BaseModel):
    """Response after updating settings."""
    status: Literal["updated"]
