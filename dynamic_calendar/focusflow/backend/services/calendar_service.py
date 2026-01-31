"""
Calendar Service - Google Calendar integration.

Handles OAuth authentication and calendar operations.
"""

import os
from typing import Optional
from datetime import datetime
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from config import settings
from models import CalendarEvent


# OAuth scopes for Google Calendar
SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


class CalendarService:
    """Service for Google Calendar integration."""

    def __init__(self):
        self.client_id = settings.google_client_id
        self.client_secret = settings.google_client_secret
        self.redirect_uri = settings.google_redirect_uri
        self._credentials: Optional[Credentials] = None

    def get_auth_url(self) -> str:
        """
        Get OAuth authorization URL.

        TODO: Person D - Implement OAuth flow

        Returns:
            URL to redirect user for authorization
        """
        # TODO: Person D - Implement OAuth flow
        # flow = Flow.from_client_config(
        #     {
        #         "web": {
        #             "client_id": self.client_id,
        #             "client_secret": self.client_secret,
        #             "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        #             "token_uri": "https://oauth2.googleapis.com/token",
        #         }
        #     },
        #     scopes=SCOPES,
        #     redirect_uri=self.redirect_uri
        # )
        # auth_url, _ = flow.authorization_url(prompt="consent")
        # return auth_url

        # STUB
        return f"https://accounts.google.com/o/oauth2/auth?client_id={self.client_id}&redirect_uri={self.redirect_uri}&scope=calendar.events&response_type=code"

    def handle_callback(self, code: str) -> bool:
        """
        Handle OAuth callback and store credentials.

        TODO: Person D - Implement OAuth callback

        Args:
            code: Authorization code from Google

        Returns:
            True if successful
        """
        # TODO: Person D - Implement
        # flow = Flow.from_client_config(...)
        # flow.fetch_token(code=code)
        # self._credentials = flow.credentials
        # # Store credentials securely (e.g., encrypted in database)
        # return True

        # STUB
        print(f"📅 Would handle OAuth callback with code: {code[:10]}...")
        return False

    def _get_service(self):
        """
        Get authenticated Google Calendar service.

        TODO: Person D - Implement service creation
        """
        # TODO: Person D - Implement
        # if not self._credentials:
        #     raise Exception("Not authenticated. Call handle_callback first.")
        # return build("calendar", "v3", credentials=self._credentials)

        # STUB
        return None

    async def get_events(
        self,
        start_date: str,
        end_date: str
    ) -> list[CalendarEvent]:
        """
        Get calendar events for a date range.

        TODO: Person D - Implement event fetching

        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            List of calendar events
        """
        # TODO: Person D - Implement
        # service = self._get_service()
        # time_min = f"{start_date}T00:00:00Z"
        # time_max = f"{end_date}T23:59:59Z"
        #
        # events_result = service.events().list(
        #     calendarId="primary",
        #     timeMin=time_min,
        #     timeMax=time_max,
        #     singleEvents=True,
        #     orderBy="startTime"
        # ).execute()
        #
        # events = events_result.get("items", [])
        #
        # return [
        #     CalendarEvent(
        #         id=event["id"],
        #         title=event.get("summary", "Untitled"),
        #         start=event["start"].get("dateTime", event["start"].get("date")),
        #         end=event["end"].get("dateTime", event["end"].get("date")),
        #         predicted_duration=None  # TODO: Match with predictions
        #     )
        #     for event in events
        # ]

        # STUB: Return mock events
        print(f"📅 Would fetch events from {start_date} to {end_date}")
        return []

    async def create_event(
        self,
        title: str,
        start: str,
        end: str,
        description: Optional[str] = None
    ) -> dict:
        """
        Create a new calendar event.

        TODO: Person D - Implement event creation

        Args:
            title: Event title
            start: Start time (ISO format)
            end: End time (ISO format)
            description: Optional description

        Returns:
            Created event data
        """
        # TODO: Person D - Implement
        # service = self._get_service()
        #
        # event = {
        #     "summary": title,
        #     "start": {"dateTime": start, "timeZone": "UTC"},
        #     "end": {"dateTime": end, "timeZone": "UTC"},
        # }
        #
        # if description:
        #     event["description"] = description
        #
        # created = service.events().insert(
        #     calendarId="primary",
        #     body=event
        # ).execute()
        #
        # return {
        #     "id": created["id"],
        #     "url": created.get("htmlLink", "")
        # }

        # STUB
        print(f"📅 Would create event: {title}")
        return {"id": "mock_event_id", "url": "https://calendar.google.com"}

    async def update_event(
        self,
        event_id: str,
        updates: dict
    ) -> bool:
        """
        Update an existing calendar event.

        TODO: Person D - Implement event update

        Args:
            event_id: ID of event to update
            updates: Fields to update

        Returns:
            True if successful
        """
        # TODO: Person D - Implement
        # service = self._get_service()
        # event = service.events().get(calendarId="primary", eventId=event_id).execute()
        # event.update(updates)
        # service.events().update(calendarId="primary", eventId=event_id, body=event).execute()
        # return True

        # STUB
        print(f"📅 Would update event {event_id}")
        return False

    async def delete_event(self, event_id: str) -> bool:
        """
        Delete a calendar event.

        TODO: Person D - Implement event deletion

        Args:
            event_id: ID of event to delete

        Returns:
            True if successful
        """
        # TODO: Person D - Implement
        # service = self._get_service()
        # service.events().delete(calendarId="primary", eventId=event_id).execute()
        # return True

        # STUB
        print(f"📅 Would delete event {event_id}")
        return False

    def is_authenticated(self) -> bool:
        """Check if we have valid credentials."""
        return self._credentials is not None and self._credentials.valid
