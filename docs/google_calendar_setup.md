# Google Calendar API Setup Guide

This guide explains how to set up the Google Calendar API for the FocusFlow backend.

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project drop-down and select **New Project**.
3. Enter a project name (e.g., `FocusFlow`) and click **Create**.

## 2. Enable Google Calendar API

1. In the Google Cloud Console, go to **APIs & Services > Library**.
2. Search for "Google Calendar API".
3. Click on **Google Calendar API** and then click **Enable**.

## 3. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** (or **Internal** if you have a Google Workspace organization) and click **Create**.
3. Fill in the required fields:
   - **App name**: FocusFlow
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **Save and Continue**.
5. **Scopes**: Click **Add or Remove Scopes**.
   - Search for `calendar` and select `.../auth/calendar` (See, edit, share, and permanently delete all the calendars you can access using Google Calendar).
   - Click **Update**.
   - Click **Save and Continue**.
6. **Test Users**:
   - Click **Add Users** and add your own Google email address (the one you will use to test).
   - Click **Save and Continue**.

## 4. Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. For **Application type**, select **Desktop app**.
4. Name it `FocusFlow Backend`.
5. Click **Create**.

## 5. Download Credentials

1. After creating the OAuth client, a popup will appear. Click **Download JSON**.
2. Rename the downloaded file to `credentials.json`.
3. Move `credentials.json` to the **backend root directory** (`/Users/shail/Documents/ChromeExtension/backend/`).
   - The path should be `.../backend/credentials.json`.

## 6. Initialize the Connection

1. Open a terminal in the project root.
2. Run the initialization script:
   ```bash
   python -m backend.scripts.init_calendar
   ```
3. A browser window will open asking you to log in to your Google account.
4. Allow FocusFlow to access your calendar.
5. Once successful, a `token.json` file will be created in the `backend/` directory.

## 7. Verify Setup

1. Start the backend server.
2. Visit `http://localhost:8000/calendar/setup-status` (adjust port if needed).
3. It should return `{"status": "connected", ...}`.