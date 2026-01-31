from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db, CATEGORIES
from backend.services.calendar_service import get_upcoming_events, create_calendar_event
from backend.services.prediction_engine import get_prediction
from backend.schemas import CalendarEvent, CalendarEventCreate
from datetime import datetime, timedelta
import dateutil.parser

router = APIRouter()

def categorize_text(text: str) -> str:
    text = text.lower()
    for category, domains in CATEGORIES.items():
        if category in text:
            return category
        # Heuristic: check if domains are mentioned? or keywords?
        # Simple keyword matching
        if category == "coding" and any(w in text for w in ["code", "dev", "program", "git"]):
            return category
        if category == "writing" and any(w in text for w in ["write", "doc", "edit", "blog"]):
            return category
        if category == "research" and any(w in text for w in ["research", "study", "read"]):
            return category
    return "uncategorized"

@router.get("/calendar", response_model=list[CalendarEvent])
def get_calendar(db: Session = Depends(get_db)):
    events = get_upcoming_events()
    result = []
    
    for event in events:
        # Parse start/end
        start = event.get('start', {}).get('dateTime') or event.get('start', {}).get('date')
        end = event.get('end', {}).get('dateTime') or event.get('end', {}).get('date')
        
        if not start or not end:
            continue
            
        # Basic parsing (ignoring timezone issues for simplicity in this snippet)
        try:
            start_dt = dateutil.parser.parse(start)
            end_dt = dateutil.parser.parse(end)
        except:
            continue

        summary = event.get('summary', 'No Title')
        
        # Predict duration
        category = categorize_text(summary)
        prediction = get_prediction(db, category)
        predicted_ms = prediction['predicted_duration_ms']
        
        result.append({
            "summary": summary,
            "start_time": start_dt,
            "end_time": end_dt,
            "description": event.get('description'),
            "predicted_duration_ms": predicted_ms
        })
        
    return result

@router.post("/calendar", response_model=CalendarEvent)
def add_event(event_data: CalendarEventCreate):
    created_event = create_calendar_event(
        summary=event_data.summary,
        start_time=event_data.start_time,
        duration_minutes=event_data.duration_minutes,
        description=event_data.description
    )
    
    if not created_event:
        raise HTTPException(status_code=500, detail="Failed to create calendar event")
        
    # Construct response
    start_dt = event_data.start_time
    end_dt = start_dt + timedelta(minutes=event_data.duration_minutes)
    
    return {
        "summary": event_data.summary,
        "start_time": start_dt,
        "end_time": end_dt,
        "description": event_data.description,
        "predicted_duration_ms": None # New event, no prediction needed in response immediately?
    }
