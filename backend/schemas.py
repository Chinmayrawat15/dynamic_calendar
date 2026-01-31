from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Activity Schemas ---
class ActivityLog(BaseModel):
    task_name: Optional[str] = None
    domain: str
    title: Optional[str] = None
    duration_ms: int
    focus_score: float
    tab_switches: int
    timestamp: Optional[datetime] = None

class ActivityResponse(BaseModel):
    status: str
    count: int

# --- Prediction Schemas ---
class PredictionResponse(BaseModel):
    predicted_duration_ms: int
    confidence: str # "low", "medium", "high"
    explanation: str

# --- Stats Schemas ---
class StatsResponse(BaseModel):
    today_focus_score: float
    hours_tracked_today: float
    prediction_accuracy_percent: float
    total_sessions: int

# --- Settings Schemas ---
class SettingsUpdate(BaseModel):
    conservativity: float = Field(..., ge=0.0, le=1.0)
    tracked_sites: Optional[List[str]] = None

class SettingsResponse(BaseModel):
    conservativity: float
    tracked_sites: List[str]

# --- Chat Schemas ---
class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = {}

class ChatResponse(BaseModel):
    response: str
    suggestions: Optional[List[str]] = []

# --- Calendar Schemas ---
class CalendarEvent(BaseModel):
    summary: str
    start_time: datetime
    end_time: datetime
    description: Optional[str] = None
    predicted_duration_ms: Optional[int] = None

class CalendarEventCreate(BaseModel):
    summary: str
    start_time: datetime
    duration_minutes: int
    description: Optional[str] = None

