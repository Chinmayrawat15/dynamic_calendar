"""
Calendar Router - Handles Google Calendar integration.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session as DBSession
from datetime import datetime, timedelta

from models import CalendarEventsResponse, CalendarEvent, CreateEventRequest, CreateEventResponse
from database import get_db
from services.calendar_service import CalendarService

router = APIRouter()


# Create singleton calendar service instance
calendar_service = CalendarService()


@router.get("/calendar/auth/status")
async def get_auth_status():
    """
    Check Google Calendar authentication status.
    Returns user profile if authenticated.
    """
    is_authenticated = calendar_service.is_authenticated()

    if is_authenticated:
        profile = calendar_service.get_user_profile()
        return {
            "authenticated": True,
            "email": profile.get("email") if profile else None,
            "name": profile.get("name") if profile else None,
            "given_name": profile.get("given_name") if profile else None,
            "picture": profile.get("picture") if profile else None,
        }

    return {
        "authenticated": False,
        "email": None,
        "name": None,
        "given_name": None,
        "picture": None,
    }


@router.get("/calendar/auth")
async def calendar_auth():
    """
    Initiate Google Calendar OAuth flow.
    Returns the URL to redirect the user for authorization.
    """
    try:
        auth_url = calendar_service.get_auth_url()
        return {"auth_url": auth_url}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"📅 Error generating auth URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate authentication")


@router.get("/calendar/callback")
async def calendar_callback(code: str = Query(...)):
    """
    Handle Google Calendar OAuth callback.
    Exchanges the authorization code for tokens.
    """
    success = calendar_service.handle_callback(code)

    if success:
        # Return a success page that closes the popup
        return HTMLResponse(content="""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authentication Successful</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .container {
                    text-align: center;
                    padding: 40px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 16px;
                    backdrop-filter: blur(10px);
                }
                .icon {
                    font-size: 64px;
                    margin-bottom: 20px;
                }
                h1 { margin: 0 0 10px 0; font-size: 24px; }
                p { margin: 0; opacity: 0.8; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">✓</div>
                <h1>Connected Successfully!</h1>
                <p>You can close this window now.</p>
            </div>
            <script>
                setTimeout(function() {
                    window.close();
                }, 2000);
            </script>
        </body>
        </html>
        """)
    else:
        return HTMLResponse(content="""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authentication Failed</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: #ef4444;
                    color: white;
                }
                .container {
                    text-align: center;
                    padding: 40px;
                }
                .icon { font-size: 64px; margin-bottom: 20px; }
                h1 { margin: 0 0 10px 0; font-size: 24px; }
                p { margin: 0; opacity: 0.8; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">✗</div>
                <h1>Authentication Failed</h1>
                <p>Please try again.</p>
            </div>
        </body>
        </html>
        """, status_code=400)


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
    print(f"📅 Calendar request: {start} to {end}")

    # Check if authenticated
    if not calendar_service.is_authenticated():
        # Return mock data if not authenticated
        print("📅 Not authenticated, returning mock data")
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
                predicted_duration=None
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

    # Fetch real events from Google Calendar
    try:
        events = await calendar_service.get_events(start, end)
        return CalendarEventsResponse(events=events)
    except Exception as e:
        print(f"📅 Error fetching events: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch calendar events")


@router.post("/calendar", response_model=CreateEventResponse)
async def create_calendar_event(
    request: CreateEventRequest,
    db: DBSession = Depends(get_db)
):
    """
    Create a new calendar event.
    """
    print(f"📅 Create event: {request.title}")
    print(f"   Start: {request.start}")
    print(f"   End: {request.end}")

    # Check if authenticated
    if not calendar_service.is_authenticated():
        # Return mock response if not authenticated
        print("📅 Not authenticated, returning mock response")
        import uuid
        event_id = f"evt_{uuid.uuid4().hex[:8]}"
        return CreateEventResponse(
            event_id=event_id,
            url=f"https://calendar.google.com/calendar/event?eid={event_id}"
        )

    # Create real event in Google Calendar
    try:
        result = await calendar_service.create_event(
            title=request.title,
            start=request.start,
            end=request.end,
            description=request.description
        )
        return CreateEventResponse(
            event_id=result["id"],
            url=result["url"]
        )
    except Exception as e:
        print(f"📅 Error creating event: {e}")
        raise HTTPException(status_code=500, detail="Failed to create calendar event")


@router.delete("/calendar/{event_id}")
async def delete_calendar_event(event_id: str):
    """
    Delete a calendar event.
    """
    if not calendar_service.is_authenticated():
        raise HTTPException(status_code=401, detail="Not authenticated with Google Calendar")

    success = await calendar_service.delete_event(event_id)
    if success:
        return {"status": "deleted", "event_id": event_id}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete event")


@router.post("/calendar/disconnect")
async def disconnect_calendar():
    """
    Disconnect Google Calendar integration.
    """
    calendar_service.disconnect()
    return {"status": "disconnected"}


@router.post("/calendar/logout")
async def logout():
    """
    Logout user and clear Google Calendar credentials.
    """
    calendar_service.disconnect()
    return {"status": "logged_out"}
