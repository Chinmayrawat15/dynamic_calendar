"""
Calendar Router - Handles Google Calendar integration.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session as DBSession
from datetime import datetime, timedelta
from fastapi.responses import RedirectResponse, HTMLResponse
from models import CalendarEventsResponse, CalendarEvent, CreateEventRequest, CreateEventResponse
from database import get_db
from services.calendar_service import CalendarService

router = APIRouter()


@router.get("/calendar", response_model=CalendarEventsResponse)
async def get_calendar_events(
    start: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end: str = Query(..., description="End date (YYYY-MM-DD)"),
    db: DBSession = Depends(get_db)
):
    """
    Get calendar events for a date range.
    """
    service = CalendarService()
    
    # If not authenticated, return empty list (frontend should handle auth prompt)
    if not service.is_authenticated():
        return CalendarEventsResponse(events=[])
        
    events = await service.get_events(start, end)
    return CalendarEventsResponse(events=events)


@router.post("/calendar", response_model=CreateEventResponse)
async def create_calendar_event(
    request: CreateEventRequest,
    db: DBSession = Depends(get_db)
):
    """
    Create a new calendar event.
    """
    service = CalendarService()
    event = await service.create_event(
        title=request.title,
        start=request.start,
        end=request.end,
        description=request.description
    )
    return CreateEventResponse(
        event_id=event.get("id"),
        url=event.get("url", "")
    )


@router.get("/calendar/auth")
async def calendar_auth():
    """
    Initiate Google Calendar OAuth flow.
    """
    service = CalendarService()
    try:
        auth_url = service.get_auth_url()
        return RedirectResponse(url=auth_url)
    except Exception as e:
        return {"error": str(e)}


@router.get("/calendar/callback", response_class=HTMLResponse)
async def calendar_callback(code: str = Query(...)):
    """
    Handle Google Calendar OAuth callback.
    """
    service = CalendarService()
    success = service.handle_callback(code)
    
    if success:
        return """
        <html>
            <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h1 style="color: green;">Authentication Successful!</h1>
                <p>FocusFlow is now connected to your Google Calendar.</p>
                <p>You can close this window and return to the application.</p>
            </body>
        </html>
        """
    else:
        return """
        <html>
            <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h1 style="color: red;">Authentication Failed</h1>
                <p>Please check the backend logs for details.</p>
            </body>
        </html>
        """
