from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db, CATEGORIES
from backend.services.calendar_service import get_upcoming_events, create_calendar_event, check_calendar_setup, get_calendar_service
from backend.services.prediction_engine import get_prediction
from backend.services.keywords_ai_service import generate_response, generate_structured_response
from backend.schemas import CalendarEvent, CalendarEventCreate, WeekPlanEvent, WeekPlanResponse, ScheduleRequest, ScheduleResponse, ScheduledEvent
from datetime import datetime, timezone, timedelta
import dateutil.parser


# ... (existing imports)
router = APIRouter()

@router.get("/calendar/setup-status")
def get_calendar_setup_status():
    """
    Returns the setup status of the Google Calendar integration.
    """
    return check_calendar_setup()

@router.post("/calendar/schedule", response_model=ScheduleResponse)
async def schedule_from_prompt(request: ScheduleRequest, db: Session = Depends(get_db)):
    """
    Interprets natural language prompts to schedule events.
    Uses Keywords AI to parse intent and extract structured event data.
    """
    # Check if calendar service is available first
    if not get_calendar_service():
        return ScheduleResponse(
            events=[],
            frontend_message="Google Calendar is not configured. Please check the backend setup."
        )

    now_utc = datetime.now(timezone.utc).isoformat()
    
    # User-defined System Prompt
    system_instruction = (
        f"You are a backend assistant for FocusFlow's calendar scheduling system. Your task is to convert a user's natural language scheduling request into **structured, actionable JSON events** that can be directly used to create Google Calendar events. **Everything else is irrelevant.**\n\n"
        f"Follow these instructions **exactly**:\n\n"
        f"1. **JSON Only**: Output must be a strict JSON object. Do NOT include explanations, markdown, comments, or extra text. If you cannot infer times, provide an empty array but always include the `frontend_message`.\n\n"
        f"2. **Required Fields per Event**:\n"
        f"   - \"summary\" (string): event title\n"
        f"   - \"start_time\" (ISO8601 UTC string)\n"
        f"   - \"duration_minutes\" (integer)\n"
        f"   - Optional: \"description\" (string), \"location\" (string), \"attendees\" (list of emails), \"priority\" (low/medium/high), \"tags\" (list of strings)\n\n"
        f"3. **Ambiguous Times**: If a user specifies vague times, use these defaults (all in UTC):\n"
        f"   - Lunch → 12:30 PM\n"
        f"   - Dinner → 19:00\n"
        f"   - Study / Work session → 18:00\n"
        f"   - Club / Leisure → 20:00\n"
        f"   - Meetings → 10:00 AM\n\n"
        f"4. **Recurring / Multiple Events**:\n"
        f"   - For recurring events (e.g., \"study each evening\"), create one event per day for each occurrence within the next 7 days.\n\n"
        f"5. **Conservatism**:\n"
        f"   - The user may provide a `conservatism` factor (0-1) that adjusts event durations:\n"
        f"     `duration_minutes = estimated_duration_minutes * (1 + conservatism)`\n\n"
        f"6. **Output Schema**: Your JSON must exactly match:\n"
        f"```json\n"
        f"{{\n"
        f"  \"events\": [\n"
        f"    {{\n"
        f"      \"summary\": \"string\",\n"
        f"      \"start_time\": \"ISO8601 string in UTC\",\n"
        f"      \"duration_minutes\": 0,\n"
        f"      \"description\": \"string (optional)\",\n"
        f"      \"location\": \"string (optional)\",\n"
        f"      \"attendees\": [\"string (optional)\"],\n"
        f"      \"priority\": \"string (optional: low/medium/high)\",\n"
        f"      \"tags\": [\"string (optional)\"]\n"
        f"    }}\n"
        f"  ],\n"
        f"  \"frontend_message\": \"string (concise, user-friendly summary)\"\n"
        f"}}\n"
        f"Always return events array, never leave it undefined. Use defaults for ambiguous times if necessary.\n\n"
        f"**Current UTC time:** {now_utc}\n"
        f"**User Prompt:** \"{request.user_prompt}\"\n"
        f"**Conservatism Factor:** {request.conservatism}"
    )
    
    # We use generate_structured_response to ensure clean JSON parsing
    # The prompt itself is very detailed, so we pass a minimal schema description or just the prompt.
    # The function expects (prompt, schema_desc), but our prompt embeds the schema.
    # We'll pass the prompt as the 'prompt' and a simplified reminder as 'schema_desc'.
    
    schema_reminder = """
    {
      "events": [{"summary": "...", "start_time": "...", "duration_minutes": ...}],
      "frontend_message": "..."
    }
    """
    
    response_data = await generate_structured_response(system_instruction, schema_reminder)
    
    if not response_data or "events" not in response_data:
        return ScheduleResponse(
            events=[],
            frontend_message="I couldn't understand that request. Could you be more specific about the time?"
        )
        
    # Transform to Google Calendar format and create events
    scheduled_events = []
    
    for event_data in response_data.get("events", []):
        try:
            # Parse start time from ISO string
            start_dt = dateutil.parser.isoparse(event_data["start_time"])
            
            # Create event in Google Calendar
            # We map the AI's output to the service function's parameters
            google_event = create_calendar_event(
                summary=event_data["summary"],
                start_time=start_dt,
                duration_minutes=event_data["duration_minutes"],
                description=event_data.get("description", "")
            )
            
            if google_event:
                # Construct the response object
                # We preserve fields like location/attendees in the response 
                # even if the basic create_calendar_event service doesn't use them yet
                scheduled_events.append(ScheduledEvent(
                    summary=event_data["summary"],
                    start_time=start_dt,
                    duration_minutes=event_data["duration_minutes"],
                    description=event_data.get("description", ""),
                    location=event_data.get("location", ""),
                    attendees=event_data.get("attendees", []),
                    priority=event_data.get("priority", "medium"),
                    tags=event_data.get("tags", [])
                ))
        except Exception as e:
            # Log error but continue processing other events
            print(f"Error creating event '{event_data.get('summary', 'Unknown')}': {e}")
            continue

    return ScheduleResponse(
        events=scheduled_events,
        frontend_message=response_data.get("frontend_message", "Here are your scheduled events.")
    )


def transform_to_google_calendar(event: dict) -> dict:
    """
    Transforms a structured AI event into a Google Calendar API-friendly format.
    """
    try:
        # 1. Parse Start Time (Assume UTC if naive)
        start_str = event.get("start_time")
        if not start_str:
            return {}
            
        start_dt = dateutil.parser.parse(start_str)
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
            
        # 2. Calculate End Time
        duration_minutes = event.get("duration_minutes", 30)
        end_dt = start_dt + timedelta(minutes=duration_minutes)
        
        # 3. Construct Google Calendar Event Dict
        google_event = {
            "summary": event.get("summary", "New Event"),
            "start": {"dateTime": start_dt.isoformat()},
            "end": {"dateTime": end_dt.isoformat()},
            "description": event.get("description", ""),
            "location": event.get("location", ""),
            "attendees": [{"email": email} for email in event.get("attendees", [])],
            # Reminders can be default
            "reminders": {"useDefault": True}
        }
        
        return google_event
    except Exception as e:
        print(f"Error transforming event {event.get('summary', 'Unknown')}: {e}")
        return {}


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
