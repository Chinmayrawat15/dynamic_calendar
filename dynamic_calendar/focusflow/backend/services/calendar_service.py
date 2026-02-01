"""
Calendar Service - Google Calendar integration.

Handles OAuth authentication and calendar operations.
"""

import os
import json
from typing import Optional
from datetime import datetime
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from config import settings
from models import CalendarEvent


# OAuth scopes for Google Calendar and user profile
SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid"
]

# Token storage file path
TOKEN_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "google_token.json")


class CalendarService:
    """Service for Google Calendar integration."""

    _instance = None
    _credentials: Optional[Credentials] = None

    def __new__(cls):
        """Singleton pattern to maintain credentials across requests."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_stored_credentials()
        return cls._instance

    def __init__(self):
        self.client_id = settings.google_client_id
        self.client_secret = settings.google_client_secret
        self.redirect_uri = settings.google_redirect_uri

    def _load_stored_credentials(self):
        """Load credentials from storage if available."""
        try:
            if os.path.exists(TOKEN_FILE):
                with open(TOKEN_FILE, "r") as f:
                    token_data = json.load(f)
                    self._credentials = Credentials(
                        token=token_data.get("token"),
                        refresh_token=token_data.get("refresh_token"),
                        token_uri=token_data.get("token_uri"),
                        client_id=token_data.get("client_id"),
                        client_secret=token_data.get("client_secret"),
                        scopes=token_data.get("scopes")
                    )
                    print("📅 Loaded stored Google Calendar credentials")
        except Exception as e:
            print(f"📅 Could not load stored credentials: {e}")
            self._credentials = None

    def _save_credentials(self):
        """Save credentials to storage."""
        if self._credentials:
            try:
                os.makedirs(os.path.dirname(TOKEN_FILE), exist_ok=True)
                token_data = {
                    "token": self._credentials.token,
                    "refresh_token": self._credentials.refresh_token,
                    "token_uri": self._credentials.token_uri,
                    "client_id": self._credentials.client_id,
                    "client_secret": self._credentials.client_secret,
                    "scopes": list(self._credentials.scopes) if self._credentials.scopes else SCOPES
                }
                with open(TOKEN_FILE, "w") as f:
                    json.dump(token_data, f)
                print("📅 Saved Google Calendar credentials")
            except Exception as e:
                print(f"📅 Could not save credentials: {e}")

    def _get_flow(self) -> Flow:
        """Create OAuth flow."""
        client_config = {
            "web": {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [self.redirect_uri]
            }
        }
        return Flow.from_client_config(
            client_config,
            scopes=SCOPES,
            redirect_uri=self.redirect_uri
        )

    def get_auth_url(self) -> str:
        """
        Get OAuth authorization URL.

        Returns:
            URL to redirect user for authorization
        """
        if not self.client_id or not self.client_secret:
            raise ValueError("Google Calendar credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env")

        flow = self._get_flow()
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent"
        )
        return auth_url

    def handle_callback(self, code: str) -> bool:
        """
        Handle OAuth callback and store credentials.

        Args:
            code: Authorization code from Google

        Returns:
            True if successful
        """
        try:
            flow = self._get_flow()
            flow.fetch_token(code=code)
            self._credentials = flow.credentials
            self._save_credentials()
            print(f"📅 Successfully authenticated with Google Calendar")
            return True
        except Exception as e:
            print(f"📅 OAuth callback failed: {e}")
            return False

    def _get_service(self):
        """
        Get authenticated Google Calendar service.
        """
        if not self._credentials:
            raise Exception("Not authenticated. Please connect Google Calendar first.")

        # Refresh token if expired
        if self._credentials.expired and self._credentials.refresh_token:
            from google.auth.transport.requests import Request
            self._credentials.refresh(Request())
            self._save_credentials()

        return build("calendar", "v3", credentials=self._credentials)

    async def get_events(
        self,
        start_date: str,
        end_date: str
    ) -> list[CalendarEvent]:
        """
        Get calendar events for a date range.

        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            List of calendar events
        """
        try:
            service = self._get_service()
            time_min = f"{start_date}T00:00:00Z"
            time_max = f"{end_date}T23:59:59Z"

            events_result = service.events().list(
                calendarId="primary",
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy="startTime"
            ).execute()

            events = events_result.get("items", [])

            return [
                CalendarEvent(
                    id=event["id"],
                    title=event.get("summary", "Untitled"),
                    start=event["start"].get("dateTime", event["start"].get("date")),
                    end=event["end"].get("dateTime", event["end"].get("date")),
                    predicted_duration=None  # Could integrate with predictions
                )
                for event in events
            ]
        except HttpError as e:
            print(f"📅 Failed to fetch events: {e}")
            raise
        except Exception as e:
            print(f"📅 Error fetching events: {e}")
            raise

    async def create_event(
        self,
        title: str,
        start: str,
        end: str,
        description: Optional[str] = None
    ) -> dict:
        """
        Create a new calendar event.

        Args:
            title: Event title
            start: Start time (ISO format)
            end: End time (ISO format)
            description: Optional description

        Returns:
            Created event data with id and url
        """
        try:
            service = self._get_service()

            event = {
                "summary": title,
                "start": {"dateTime": start, "timeZone": "UTC"},
                "end": {"dateTime": end, "timeZone": "UTC"},
            }

            if description:
                event["description"] = description

            created = service.events().insert(
                calendarId="primary",
                body=event
            ).execute()

            print(f"📅 Created event: {title}")
            return {
                "id": created["id"],
                "url": created.get("htmlLink", "")
            }
        except HttpError as e:
            print(f"📅 Failed to create event: {e}")
            raise
        except Exception as e:
            print(f"📅 Error creating event: {e}")
            raise

    async def update_event(
        self,
        event_id: str,
        updates: dict
    ) -> bool:
        """
        Update an existing calendar event.

        Args:
            event_id: ID of event to update
            updates: Fields to update

        Returns:
            True if successful
        """
        try:
            service = self._get_service()
            event = service.events().get(calendarId="primary", eventId=event_id).execute()

            # Update summary if provided
            if "title" in updates:
                event["summary"] = updates["title"]
            if "start" in updates:
                event["start"] = {"dateTime": updates["start"], "timeZone": "UTC"}
            if "end" in updates:
                event["end"] = {"dateTime": updates["end"], "timeZone": "UTC"}
            if "description" in updates:
                event["description"] = updates["description"]

            service.events().update(
                calendarId="primary",
                eventId=event_id,
                body=event
            ).execute()

            print(f"📅 Updated event {event_id}")
            return True
        except Exception as e:
            print(f"📅 Error updating event: {e}")
            return False

    async def delete_event(self, event_id: str) -> bool:
        """
        Delete a calendar event.

        Args:
            event_id: ID of event to delete

        Returns:
            True if successful
        """
        try:
            service = self._get_service()
            service.events().delete(calendarId="primary", eventId=event_id).execute()
            print(f"📅 Deleted event {event_id}")
            return True
        except Exception as e:
            print(f"📅 Error deleting event: {e}")
            return False

    def is_authenticated(self) -> bool:
        """Check if we have valid credentials."""
        if not self._credentials:
            return False
        if self._credentials.expired and self._credentials.refresh_token:
            try:
                from google.auth.transport.requests import Request
                self._credentials.refresh(Request())
                self._save_credentials()
                return True
            except Exception:
                return False
        return self._credentials.valid if hasattr(self._credentials, 'valid') else self._credentials.token is not None

    def get_user_email(self) -> Optional[str]:
        """Get the authenticated user's email."""
        if not self.is_authenticated():
            return None
        try:
            service = self._get_service()
            calendar = service.calendars().get(calendarId="primary").execute()
            return calendar.get("summary", None)
        except Exception:
            return None

    def get_user_profile(self) -> Optional[dict]:
        """Get the authenticated user's profile (name, email, picture)."""
        if not self.is_authenticated():
            return None
        try:
            from google.auth.transport.requests import Request
            import requests

            # Ensure credentials are fresh
            if self._credentials.expired and self._credentials.refresh_token:
                self._credentials.refresh(Request())
                self._save_credentials()

            # Use the userinfo endpoint
            headers = {"Authorization": f"Bearer {self._credentials.token}"}
            response = requests.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers=headers
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "email": data.get("email"),
                    "name": data.get("name"),
                    "picture": data.get("picture"),
                    "given_name": data.get("given_name"),
                }
            return None
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return None

    def disconnect(self):
        """Disconnect and clear stored credentials."""
        self._credentials = None
        if os.path.exists(TOKEN_FILE):
            os.remove(TOKEN_FILE)
        print("📅 Disconnected from Google Calendar")
