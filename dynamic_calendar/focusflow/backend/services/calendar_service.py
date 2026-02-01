"""
Calendar Service - Google Calendar integration.

Handles OAuth authentication and calendar operations.
"""

import os
from typing import Optional
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
        self.token_file = "token.json"
        self._load_credentials()

    def _load_credentials(self):
        """Load credentials from local file if available."""
        if os.path.exists(self.token_file):
            try:
                self._credentials = Credentials.from_authorized_user_file(self.token_file, SCOPES)
            except Exception as e:
                print(f"Error loading token: {e}")

    def _save_credentials(self):
        """Save credentials to local file."""
        if self._credentials:
            with open(self.token_file, "w") as token:
                token.write(self._credentials.to_json())

    def get_auth_url(self) -> str:
        """
        Get OAuth authorization URL.
        """
        if not self.client_id or not self.client_secret:
            raise Exception("Google Client ID/Secret not configured in .env")

        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=SCOPES,
            redirect_uri=self.redirect_uri
        )
        auth_url, _ = flow.authorization_url(prompt="consent")
        return auth_url

    def handle_callback(self, code: str) -> bool:
        """
        Handle OAuth callback and store credentials.
        """
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                },
                scopes=SCOPES,
                redirect_uri=self.redirect_uri
            )
            flow.fetch_token(code=code)
            self._credentials = flow.credentials
            self._save_credentials()
            return True
        except Exception as e:
            print(f"OAuth callback error: {e}")
            return False

    def _get_service(self):
        """
        Get authenticated Google Calendar service.
        """
        if not self._credentials or not self._credentials.valid:
            if self._credentials and self._credentials.expired and self._credentials.refresh_token:
                from google.auth.transport.requests import Request
                self._credentials.refresh(Request())
                self._save_credentials()
            else:
                return None

        return build("calendar", "v3", credentials=self._credentials)

    async def get_events_raw(
        self,
        start_date: str,
        end_date: str
    ) -> list[dict]:
        """
        Get raw calendar events from Google Calendar for a date range.
        """
        service = self._get_service()
        if not service:
            return []

        time_min = f"{start_date}T00:00:00Z"
        time_max = f"{end_date}T23:59:59Z"

        try:
            events_result = service.events().list(
                calendarId="primary",
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy="startTime"
            ).execute()

            return events_result.get("items", [])
        except HttpError as e:
            print(f"Google Calendar API Error: {e}")
            return []

    async def get_events(
        self,
        start_date: str,
        end_date: str
    ) -> list[CalendarEvent]:
        """
        Get calendar events for a date range.
        """
        events = await self.get_events_raw(start_date, end_date)
        return [
            CalendarEvent(
                id=event["id"],
                title=event.get("summary", "Untitled"),
                start=event["start"].get("dateTime", event["start"].get("date")),
                end=event["end"].get("dateTime", event["end"].get("date")),
                predicted_duration=None
            )
            for event in events
        ]

    async def create_event(
        self,
        title: str,
        start: str,
        end: str,
        time_zone: Optional[str] = None,
        description: Optional[str] = None
    ) -> dict:
        """
        Create a new calendar event.
        """
        service = self._get_service()
        if not service:
            raise Exception("Not authenticated")

        event = {
            "summary": title,
            "start": {"dateTime": start},
            "end": {"dateTime": end},
        }

        if time_zone:
            event["start"]["timeZone"] = time_zone
            event["end"]["timeZone"] = time_zone

        if description:
            event["description"] = description

        try:
            created = service.events().insert(
                calendarId="primary",
                body=event
            ).execute()

            return created
        except HttpError as e:
            print(f"Error creating event: {e}")
            raise

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
        if not self._credentials:
            return False
        if self._credentials.valid:
            return True
        return bool(self._credentials.expired and self._credentials.refresh_token)
