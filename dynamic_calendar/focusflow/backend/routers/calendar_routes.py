"""
Calendar Router - Handles Google Calendar integration.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session as DBSession
from datetime import datetime, timedelta

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

    Returns events with predicted durations when available.

    TODO: Person D - Replace mock with real Google Calendar API
    """
    # STUB: Log the request
    print(f"📅 Calendar request: {start} to {end}")

    # TODO: Person D - Use real calendar service
    # service = CalendarService()
    # events = await service.get_events(start, end)
    # return CalendarEventsResponse(events=events)

    # MOCK: Return sample calendar events
    mock_events = [
        CalendarEvent(
            id="evt_1",
            title="Team Standup",
            start="2026-01-31T09:00:00Z",
            end="2026-01-31T09:30:00Z",
            predicted_duration=25
        ),
        CalendarEvent(
            id="evt_2",
            title="Code Review Session",
            start="2026-01-31T10:00:00Z",
            end="2026-01-31T11:00:00Z",
            predicted_duration=55
        ),
        CalendarEvent(
            id="evt_3",
            title="Feature Development",
            start="2026-01-31T14:00:00Z",
            end="2026-01-31T16:00:00Z",
            predicted_duration=None  # No prediction available
        ),
        CalendarEvent(
            id="evt_4",
            title="1:1 with Manager",
            start="2026-02-01T11:00:00Z",
            end="2026-02-01T11:30:00Z",
            predicted_duration=30
        ),
        CalendarEvent(
            id="evt_5",
            title="Sprint Planning",
            start="2026-02-03T13:00:00Z",
            end="2026-02-03T15:00:00Z",
            predicted_duration=110
        ),
    ]

    return CalendarEventsResponse(events=mock_events)


@router.post("/calendar", response_model=CreateEventResponse)
async def create_calendar_event(
    request: CreateEventRequest,
    db: DBSession = Depends(get_db)
):
    """
    Create a new calendar event.

    TODO: Person D - Replace mock with real Google Calendar API
    """
    # STUB: Log the request
    print(f"📅 Create event: {request.title}")
    print(f"   Start: {request.start}")
    print(f"   End: {request.end}")

    # TODO: Person D - Use real calendar service
    # service = CalendarService()
    # event = await service.create_event(
    #     title=request.title,
    #     start=request.start,
    #     end=request.end,
    #     description=request.description
    # )
    # return CreateEventResponse(event_id=event.id, url=event.url)

    # MOCK: Return fake event creation response
    import uuid
    event_id = f"evt_{uuid.uuid4().hex[:8]}"

    return CreateEventResponse(
        event_id=event_id,
        url=f"https://calendar.google.com/calendar/event?eid={event_id}"
    )


@router.get("/calendar/auth")
async def calendar_auth():
    """
    Initiate Google Calendar OAuth flow.

    TODO: Person D - Implement OAuth redirect
    """
    # MOCK: Return instructions
    return {
        "status": "not_implemented",
        "message": "OAuth flow not yet implemented. See docs/GOOGLE_CALENDAR_SETUP.md"
    }


@router.get("/calendar/callback")
async def calendar_callback(code: str = Query(...)):
    """
    Handle Google Calendar OAuth callback.

    TODO: Person D - Implement OAuth token exchange
    """
    # MOCK: Return instructions
    return {
        "status": "not_implemented",
        "message": "OAuth callback not yet implemented."
    }
