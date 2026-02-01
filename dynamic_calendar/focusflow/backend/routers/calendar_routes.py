"""
Calendar Router - Handles Google Calendar integration.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session as DBSession
from datetime import datetime, timedelta, timezone
from fastapi.responses import RedirectResponse, HTMLResponse
from typing import Optional, Tuple

from models import CalendarEventsResponse, CalendarEvent, CreateEventRequest, CreateEventResponse
from database import get_db, CalendarEvent as CalendarEventDB
from services.calendar_service import CalendarService

router = APIRouter()


def _parse_event_datetime(value: Optional[str]) -> Tuple[Optional[datetime], bool]:
    if not value:
        return None, False
    all_day = "T" not in value
    try:
        if value.endswith("Z"):
            value = value[:-1] + "+00:00"
        dt = datetime.fromisoformat(value)
    except ValueError:
        return None, all_day
    if dt.tzinfo:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt, all_day


def _format_event_datetime(value: Optional[datetime], all_day: bool) -> str:
    if not value:
        return ""
    if all_day:
        return value.date().isoformat()
    return value.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")


def _upsert_google_events(
    db: DBSession,
    items: list[dict],
    calendar_id: str = "primary",
    user_id: str = "default"
) -> None:
    for item in items:
        event_id = item.get("id")
        if not event_id:
            continue
        status = item.get("status") or "confirmed"
        existing = db.query(CalendarEventDB).filter(
            CalendarEventDB.event_id == event_id,
            CalendarEventDB.calendar_id == calendar_id,
            CalendarEventDB.user_id == user_id
        ).one_or_none()

        if status == "cancelled":
            if existing:
                db.delete(existing)
            continue

        start_value = (item.get("start") or {}).get("dateTime") or (item.get("start") or {}).get("date")
        end_value = (item.get("end") or {}).get("dateTime") or (item.get("end") or {}).get("date")
        start_dt, start_all_day = _parse_event_datetime(start_value)
        end_dt, end_all_day = _parse_event_datetime(end_value)
        all_day = start_all_day or end_all_day

        if not start_dt or not end_dt:
            continue

        if not existing:
            existing = CalendarEventDB(
                event_id=event_id,
                calendar_id=calendar_id,
                user_id=user_id
            )

        existing.title = item.get("summary", "Untitled")
        existing.description = item.get("description")
        existing.location = item.get("location")
        existing.status = status
        existing.start_time = start_dt
        existing.end_time = end_dt
        existing.all_day = all_day
        existing.event_date = start_dt.date()
        existing.time_zone = (item.get("start") or {}).get("timeZone") or (item.get("end") or {}).get("timeZone")
        existing.etag = item.get("etag")
        existing.html_link = item.get("htmlLink")
        existing.updated_at, _ = _parse_event_datetime(item.get("updated"))
        existing.source = "google"

        db.add(existing)

    db.commit()


def _fetch_cached_events(db: DBSession, start: str, end: str) -> list[CalendarEvent]:
    try:
        start_dt = datetime.fromisoformat(start)
        end_dt = datetime.fromisoformat(end) + timedelta(days=1)
    except ValueError:
        return []

    records = db.query(CalendarEventDB).filter(
        CalendarEventDB.start_time < end_dt,
        CalendarEventDB.end_time >= start_dt
    ).order_by(CalendarEventDB.start_time.asc()).all()

    return [
        CalendarEvent(
            id=record.event_id,
            title=record.title or "Untitled",
            start=_format_event_datetime(record.start_time, record.all_day),
            end=_format_event_datetime(record.end_time, record.all_day),
            predicted_duration=None
        )
        for record in records
    ]


@router.get("/calendar", response_model=CalendarEventsResponse)
async def get_calendar_events(
    start: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end: str = Query(..., description="End date (YYYY-MM-DD)"),
    db: DBSession = Depends(get_db)
):
    """
    Get calendar events for a date range.

    Returns events with predicted durations when available.
    """
    service = CalendarService()

    if service.is_authenticated():
        items = await service.get_events_raw(start, end)
        _upsert_google_events(db, items)

    cached_events = _fetch_cached_events(db, start, end)
    return CalendarEventsResponse(events=cached_events)


@router.post("/calendar", response_model=CreateEventResponse)
async def create_calendar_event(
    request: CreateEventRequest,
    db: DBSession = Depends(get_db)
):
    """
    Create a new calendar event.
    """
    service = CalendarService()
    if not service.is_authenticated():
        raise HTTPException(status_code=401, detail="Calendar not authenticated")

    created = await service.create_event(
        title=request.title,
        start=request.start,
        end=request.end,
        time_zone=request.time_zone,
        description=request.description
    )

    _upsert_google_events(db, [created])

    return CreateEventResponse(
        event_id=created.get("id", ""),
        url=created.get("htmlLink", "")
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
        return """
        <html>
            <body style="font-family: system-ui; text-align: center; padding-top: 50px;">
                <h1 style="color: #10b981;">Authentication Successful!</h1>
                <p>You can now return to the app.</p>
            </body>
        </html>
        """
    return """
    <html>
        <body style="font-family: system-ui; text-align: center; padding-top: 50px;">
            <h1 style="color: #ef4444;">Authentication Failed</h1>
            <p>Please check the backend logs for details.</p>
        </body>
    </html>
    """
