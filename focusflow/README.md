# FocusFlow

AI-powered productivity tracking with smart task predictions and Google Calendar integration.

## What is FocusFlow?

FocusFlow is a productivity application that:
- Tracks your web activity via a Chrome extension
- Uses AI (Keywords AI) to power a smart chatbot assistant
- Predicts how long tasks will take based on your history
- Integrates with Google Calendar to schedule tasks with AI-predicted durations

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), SQLite, SQLAlchemy
- **AI**: Keywords AI (GPT-4o-mini with function calling)
- **Calendar**: Google Calendar API (OAuth2)
- **Extension**: Chrome Manifest V3

## How to Run

### Prerequisites
- Python 3.11+
- Node.js 18+

### Step 1: Start the Backend

Open a terminal and run:

```bash
cd focusflow/backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Keep this terminal open. You will see a link that says **"Click here"** - you'll need this later.

### Step 2: Start the Frontend

Open a **new terminal** and run:

```bash
cd focusflow/frontend
npm install
npm run dev
```

### Step 3: Access the Application

Go back to your **backend terminal** and click the link that says **"Click here"** to open the application in your browser.

## Important Note: OAuth Limitation

**You will not be able to fully access the site.** The Google OAuth integration will fail for external users because our Google Cloud Console project is currently in **testing mode**. Only our authorized testing emails can authenticate.

If you'd like to test the full functionality, please contact us to add your email to the testing whitelist.

## License

MIT
