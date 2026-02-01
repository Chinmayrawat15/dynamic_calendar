from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, date

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
    confidence_percent: int
    confidence_label: str
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
    confidence_percent: Optional[int] = None
    confidence_label: Optional[str] = None
    insight: Optional[str] = None

class CalendarEventCreate(BaseModel):
    summary: str
    start_time: datetime
    duration_minutes: int
    description: Optional[str] = None

# --- Week Plan Schemas ---
class WeekPlanEvent(BaseModel):
    summary: str
    date: date
    predicted_duration_ms: int
    confidence_percent: int
    confidence_label: str
    insight: str

class WeekPlanResponse(BaseModel):
    events: List[WeekPlanEvent]
    generated_by: str
    summary: str

# --- Schedule Schemas ---
class ScheduleRequest(BaseModel):
    user_prompt: str
    conservatism: float = Field(0.5, ge=0.0, le=1.0)

class ScheduledEvent(BaseModel):
    summary: str
    start_time: datetime
    duration_minutes: int
    description: Optional[str] = ""
    location: Optional[str] = ""
    attendees: Optional[List[str]] = []
    priority: Optional[str] = "medium"
    tags: Optional[List[str]] = []

class ScheduleResponse(BaseModel):
    events: List[ScheduledEvent]
    frontend_message: str

