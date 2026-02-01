import os
import datetime
import logging
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

# Define paths relative to the backend directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREDENTIALS_FILE = os.path.join(BASE_DIR, 'credentials.json')
TOKEN_FILE = os.path.join(BASE_DIR, 'token.json')
SCOPES = ['https://www.googleapis.com/auth/calendar']

def check_calendar_setup():
    """
    Checks the status of the Google Calendar integration.
    Returns a dictionary with status details and instructions.
    """
    status = {
        "credentials_exist": os.path.exists(CREDENTIALS_FILE),
        "token_exists": os.path.exists(TOKEN_FILE),
        "api_connected": False,
        "message": "Unknown status"
    }
    
    if not status["credentials_exist"]:
        status["message"] = "Missing credentials.json. Please download it from Google Cloud Console and place it in the backend/ directory."
        return status

    if not status["token_exists"]:
        status["message"] = "Missing token.json. Please run 'python -m backend.scripts.init_calendar' to authenticate."
        return status

    # Try to connect
    service = get_calendar_service()
    if service:
        status["api_connected"] = True
        status["message"] = "Google Calendar API is connected and ready."
    else:
        status["message"] = "Failed to connect to Google Calendar API. Check logs for details."
    
    return status

def get_calendar_service():
    creds = None
    
    if os.path.exists(TOKEN_FILE):
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        except Exception as e:
            logger.error(f"Error loading token.json: {e}")

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                logger.info("Refreshing expired access token...")
                creds.refresh(Request())
                with open(TOKEN_FILE, 'w') as token:
                    token.write(creds.to_json())
            except Exception as e:
                logger.error(f"Error refreshing token: {e}")
                return None
        else:
            if os.path.exists(CREDENTIALS_FILE):
                 logger.warning("Valid token not found. Please run 'python -m backend.scripts.init_calendar' to authenticate.")
                 return None
            else:
                logger.warning(f"credentials.json not found at {CREDENTIALS_FILE}. Calendar integration disabled.")
                return None

    try:
        service = build('calendar', 'v3', credentials=creds)
        return service
    except Exception as e:
        logger.error(f"Error building calendar service: {e}")
        return None

def get_upcoming_events(max_results=10):
    service = get_calendar_service()
    if not service:
        return []

    try:
        now = datetime.datetime.utcnow().isoformat() + 'Z'  # 'Z' indicates UTC time
        events_result = service.events().list(calendarId='primary', timeMin=now,
                                              maxResults=max_results, singleEvents=True,
                                              orderBy='startTime').execute()
        events = events_result.get('items', [])
        return events
    except HttpError as error:
        logger.error(f'An error occurred: {error}')
        return []

def create_calendar_event(summary, start_time, duration_minutes, description=None):
    service = get_calendar_service()
    if not service:
        return None

    end_time = start_time + datetime.timedelta(minutes=duration_minutes)

    event = {
        'summary': summary,
        'description': description,
        'start': {
            'dateTime': start_time.isoformat(),
            'timeZone': 'UTC',
        },
        'end': {
            'dateTime': end_time.isoformat(),
            'timeZone': 'UTC',
        },
    }

    try:
        event = service.events().insert(calendarId='primary', body=event).execute()
        logger.info(f"Event created: {event.get('htmlLink')}")
        return event
    except HttpError as error:
        logger.error(f'An error occurred: {error}')
        return None
