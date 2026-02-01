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
from config import settings

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
        time_zone=request.time_zone,
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


@router.get("/calendar/status")
async def get_calendar_status():
    """Check if calendar is authenticated."""
    service = CalendarService()
    return {"authenticated": service.is_authenticated()}


@router.get("/calendar/callback", response_class=HTMLResponse)
async def calendar_callback(code: str = Query(...)):
    """
    Handle Google Calendar OAuth callback.
    """
    service = CalendarService()
    success = service.handle_callback(code)
    
    if success:
        return f"""
        <html>
            <head>
                <title>FocusFlow Auth Success</title>
                <style>
                    body {{ font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f9fafb; }}
                    .card {{ background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px; width: 90%; }}
                    h1 {{ color: #10b981; margin: 0 0 1rem 0; font-size: 1.5rem; }}
                    p {{ color: #4b5563; margin-bottom: 2rem; line-height: 1.5; }}
                    .btn {{ display: inline-block; background-color: #3b82f6; color: white; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background-color 0.2s; }}
                    .btn:hover {{ background-color: #2563eb; }}
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>Authentication Successful!</h1>
                    <p>FocusFlow is now connected to your Google Calendar.</p>
                    <a href="{settings.frontend_url}/" class="btn">Return to App</a>
                </div>
            </body>
        </html>
        """
    else:
        return f"""
        <html>
            <body style="font-family: system-ui; text-align: center; padding-top: 50px;">
                <h1 style="color: #ef4444;">Authentication Failed</h1>
                <p>Please check the backend logs for details.</p>
            </body>
        </html>
        """
