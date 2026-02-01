import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.services.calendar_service import CREDENTIALS_FILE, TOKEN_FILE, SCOPES, get_calendar_service
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

def init_calendar():
    logger.info("Initializing Google Calendar Integration...")
    logger.info(f"Looking for credentials at: {CREDENTIALS_FILE}")
    
    if not os.path.exists(CREDENTIALS_FILE):
        logger.error("❌ credentials.json not found!")
        logger.info("Please download it from Google Cloud Console and place it in the backend/ directory.")
        logger.info("See docs/google_calendar_setup.md for instructions.")
        return

    creds = None
    if os.path.exists(TOKEN_FILE):
        logger.info("Found existing token.json.")
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        except Exception as e:
            logger.warning(f"Error loading token.json: {e}")
            
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            logger.info("Token expired, refreshing...")
            try:
                creds.refresh(Request())
            except Exception as e:
                logger.error(f"Error refreshing token: {e}")
                creds = None
        
        if not creds:
            logger.info("Starting OAuth flow...")
            try:
                flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
                creds = flow.run_local_server(port=0)
            except Exception as e:
                logger.error(f"❌ OAuth flow failed: {e}")
                return

        # Save the credentials for the next run
        logger.info(f"Saving token to {TOKEN_FILE}...")
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
            
    logger.info("✅ Authentication successful!")
    
    # Test connection
    logger.info("Testing API connection...")
    service = get_calendar_service()
    if service:
        try:
            events_result = service.events().list(calendarId='primary', maxResults=1, singleEvents=True, orderBy='startTime').execute()
            events = events_result.get('items', [])
            logger.info("✅ API Connection verified! Found " + str(len(events)) + " upcoming events.")
            logger.info("Setup complete. You can now use the calendar endpoints.")
        except Exception as e:
             logger.error(f"❌ API Connection failed: {e}")
    else:
        logger.error("❌ Failed to build service object.")

if __name__ == '__main__':
    init_calendar()