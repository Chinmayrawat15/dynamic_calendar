from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db, CATEGORIES
from backend.services.calendar_service import get_upcoming_events, create_calendar_event
from backend.services.prediction_engine import get_prediction
from backend.services.keywords_ai_service import generate_response
from backend.schemas import CalendarEvent, CalendarEventCreate, WeekPlanEvent, WeekPlanResponse
from datetime import datetime, timedelta, timezone
import dateutil.parser

router = APIRouter()

def categorize_text(text: str) -> str:
    text = text.lower()
    for category, domains in CATEGORIES.items():
        if category in text:
            return category
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
            
        try:
            start_dt = dateutil.parser.parse(start)
            end_dt = dateutil.parser.parse(end)
        except:
            continue

        summary = event.get('summary', 'No Title')
        
        # Calculate scheduled duration
        scheduled_ms = (end_dt - start_dt).total_seconds() * 1000
        
        # Predict duration
        category = categorize_text(summary)
        # Pass task_name=summary for exact match attempt
        prediction = get_prediction(db, category, task_name=summary)
        
        predicted_ms = prediction['predicted_duration_ms']
        confidence_percent = prediction['confidence_percent']
        confidence_label = prediction['confidence_label']
        
        # Generate Insight
        insight = None
        predicted_minutes = int(predicted_ms / 60000)
        scheduled_minutes = int(scheduled_ms / 60000)
        
        if predicted_ms > scheduled_ms * 1.15:
            insight = f"Typically takes {predicted_minutes}m, you scheduled {scheduled_minutes}m — consider adding buffer."
        elif predicted_ms < scheduled_ms * 0.85:
            insight = f"You usually finish this in {predicted_minutes}m — {scheduled_minutes}m may be more than needed."
            
        result.append({
            "summary": summary,
            "start_time": start_dt,
            "end_time": end_dt,
            "description": event.get('description'),
            "predicted_duration_ms": predicted_ms,
            "confidence_percent": confidence_percent,
            "confidence_label": confidence_label,
            "insight": insight
        })
        
    return result

@router.post("/calendar", response_model=CalendarEvent)
def add_event(event_data: CalendarEventCreate, db: Session = Depends(get_db)):
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
    
    # Get prediction for the new event
    category = categorize_text(event_data.summary)
    prediction = get_prediction(db, category, task_name=event_data.summary)
    
    return {
        "summary": event_data.summary,
        "start_time": start_dt,
        "end_time": end_dt,
        "description": event_data.description,
        "predicted_duration_ms": prediction['predicted_duration_ms'],
        "confidence_percent": prediction['confidence_percent'],
        "confidence_label": prediction['confidence_label'],
        "insight": None # No insight needed for just-created event
    }

@router.get("/calendar/week-plan", response_model=WeekPlanResponse)
async def get_week_plan(db: Session = Depends(get_db)):
    # 1. Get upcoming events
    raw_events = get_upcoming_events(max_results=50)
    
    # Filter for next 7 days
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(days=7)
    
    plan_events = []
    prompt_lines = []
    
    idx = 1
    for event in raw_events:
        start = event.get('start', {}).get('dateTime') or event.get('start', {}).get('date')
        end = event.get('end', {}).get('dateTime') or event.get('end', {}).get('date')
        
        if not start or not end:
            continue
            
        try:
            start_dt = dateutil.parser.parse(start)
            end_dt = dateutil.parser.parse(end)
            
            # Normalize timezone for comparison if needed, but dateutil handles it well.
            # Convert to UTC for consistent comparison with 'cutoff'
            if start_dt.tzinfo:
                start_dt_utc = start_dt.astimezone(timezone.utc)
            else:
                # Assume UTC if naive, or local
                start_dt_utc = start_dt.replace(tzinfo=timezone.utc)
                
            if start_dt_utc > cutoff:
                continue
                
        except:
            continue
            
        summary = event.get('summary', 'No Title')
        
        # Prediction & Insight logic (same as GET /calendar)
        scheduled_ms = (end_dt - start_dt).total_seconds() * 1000
        category = categorize_text(summary)
        prediction = get_prediction(db, category, task_name=summary)
        
        predicted_ms = prediction['predicted_duration_ms']
        confidence_percent = prediction['confidence_percent']
        confidence_label = prediction['confidence_label']
        
        predicted_minutes = int(predicted_ms / 60000)
        scheduled_minutes = int(scheduled_ms / 60000)
        
        insight = ""
        if predicted_ms > scheduled_ms * 1.15:
            insight = f"Typically takes {predicted_minutes}m, you scheduled {scheduled_minutes}m — consider adding buffer."
        elif predicted_ms < scheduled_ms * 0.85:
            insight = f"You usually finish this in {predicted_minutes}m — {scheduled_minutes}m may be more than needed."
            
        # Build WeekPlanEvent
        plan_event = WeekPlanEvent(
            summary=summary,
            date=start_dt.date(),
            predicted_duration_ms=predicted_ms,
            confidence_percent=confidence_percent,
            confidence_label=confidence_label,
            insight=insight or "On track"
        )
        plan_events.append(plan_event)
        
        # Build prompt line
        # Format: 1. [Day, Date] "Event Title" — Scheduled: Xm | Predicted: Ym | Confidence: Z%
        day_str = start_dt.strftime("%A, %Y-%m-%d")
        line = (f"{idx}. [{day_str}] \"{summary}\" — "
                f"Scheduled: {scheduled_minutes}m | "
                f"Predicted: {predicted_minutes}m | "
                f"Confidence: {confidence_percent}%")
        prompt_lines.append(line)
        idx += 1
        
    # 2. Call Keywords AI
    formatted_event_list = "\n".join(prompt_lines)
    prompt = (
        f"Here is the user's upcoming week:\n\n{formatted_event_list}\n\n"
        "Write a 2-3 sentence summary of their week. "
        "Note any heavy days, back-to-back blocks, or days where predictions suggest they'll run over. "
        "Be concise and actionable."
    )
    
    summary_text = await generate_response(prompt)
    
    return WeekPlanResponse(
        events=plan_events,
        generated_by="keywords_ai",
        summary=summary_text
    )
