# FocusFlow Team Tasks

## Quick Links
- Backend API: http://localhost:8000
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs (Swagger UI)

---

## Person A: Chrome Extension
**Owner of:** `/extension`

### Setup
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select `extension` folder

### Tasks
- [ ] **Tab Tracking** (`background.js`)
  - Listen to `chrome.tabs.onActivated` and `chrome.tabs.onUpdated`
  - Track time spent on each tab
  - Calculate focus score from tab switch frequency

- [ ] **Popup UI** (`popup/`)
  - Task input field (what user is working on)
  - Current focus score display
  - Start/Stop tracking button
  - Quick stats (time tracked today)

- [ ] **Activity Sync** (`background.js`)
  - Batch activity data every 30 seconds
  - POST to `/api/activity` endpoint
  - Handle offline mode (queue and retry)

- [ ] **Options Page** (`options/`)
  - List of domains to track (whitelist/blacklist)
  - Sync interval setting
  - Clear data button

- [ ] **Visual Indicators**
  - Badge color: green (focused) / yellow (ok) / red (distracted)
  - Badge text: current focus score

### Key Files to Modify
- `background.js` - Main tracking logic
- `popup/popup.js` - Popup interactions
- `options/options.js` - Settings management

---

## Person B: Backend + Local LLM
**Owner of:** `/backend`

### Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Tasks
- [ ] **Database Schema** (`database.py`)
  - `activities` table: url, domain, duration, timestamp, task_name
  - `sessions` table: start_time, end_time, task_name, focus_score
  - `predictions` table: task_category, predicted_minutes, actual_minutes
  - `settings` table: key-value store

- [ ] **Activity Endpoint** (`routers/activity.py`)
  - Store incoming activity data
  - Calculate and store session statistics
  - Return confirmation with count

- [ ] **Prediction Engine** (`services/prediction_engine.py`)
  - Query historical data for task category
  - Calculate base prediction from average duration
  - Apply conservativity adjustment:
    ```python
    # conservativity 0 = use median (optimistic)
    # conservativity 1 = use 90th percentile (accounts for bad days)
    adjusted = median + (p90 - median) * conservativity
    ```

- [ ] **Ollama Integration** (`services/ollama_service.py`)
  - Analyze activity patterns
  - Identify productivity blockers
  - Suggest task categorization

- [ ] **Stats Endpoint** (`routers/stats.py`)
  - Today's focus score (average)
  - Hours tracked today
  - Prediction accuracy (predicted vs actual)
  - Total sessions count

### Key Files to Modify
- `database.py` - Add real SQLite tables
- `routers/*.py` - Replace mock data with DB queries
- `services/prediction_engine.py` - Implement algorithm

---

## Person C: Frontend
**Owner of:** `/frontend`

### Setup
```bash
cd frontend
npm install
npm run dev
```

### Tasks
- [ ] **Dashboard Layout** (`app/page.tsx`)
  - Responsive grid with sidebar
  - Dark/light mode toggle
  - Real-time data refresh

- [ ] **ChatBot Component** (`components/ChatBot.tsx`)
  - Message input and history
  - POST to `/api/chat`
  - Display suggestions as clickable buttons
  - Typing indicator

- [ ] **Calendar Component** (`components/Calendar.tsx`)
  - Weekly/monthly view
  - Show events with predicted durations
  - Click to add new event
  - Color code by prediction confidence

- [ ] **Stats Cards** (`components/StatsCards.tsx`)
  - Focus score with progress ring
  - Hours tracked with trend arrow
  - Prediction accuracy percentage
  - Animate on data change

- [ ] **Conservativity Slider** (`components/ConservativitySlider.tsx`)
  - Range 0-1 with labels
  - "Aggressive" ← → "Conservative"
  - Save to `/api/settings`
  - Show example prediction change

- [ ] **Settings Page** (`app/settings/page.tsx`)
  - Conservativity slider
  - Tracked sites list (add/remove)
  - Data export button
  - Clear data button

### Key Files to Modify
- `components/*.tsx` - Add real API calls
- `lib/api.ts` - Implement fetch functions
- `app/page.tsx` - Wire up components

---

## Person D: Integration + APIs
**Owner of:** `/docs` + API integrations

### Setup
1. Get Keywords AI API key from https://platform.keywordsai.co
2. Set up Google Cloud project for Calendar API
3. Update `.env` with credentials

### Tasks
- [ ] **Keywords AI Service** (`backend/services/keywords_ai_service.py`)
  - System prompt for productivity assistant
  - Context injection (current task, stats)
  - Handle streaming responses
  - Error handling and fallbacks

- [ ] **Keywords AI Prompts**
  ```
  System: You are FocusFlow, a productivity assistant. You help users
  understand their work patterns and improve focus. Be concise and actionable.

  Context: User is working on "{task}". Focus score: {score}.
  Conservativity setting: {conservativity}.
  ```

- [ ] **Google Calendar OAuth** (`backend/services/calendar_service.py`)
  - OAuth2 flow implementation
  - Token storage and refresh
  - Fetch events for date range
  - Create new events

- [ ] **Calendar Integration**
  - Match calendar events to tracked tasks
  - Add predicted_duration to events
  - Create events with predictions

- [ ] **End-to-End Testing**
  - Extension → Backend flow
  - Chat → Keywords AI flow
  - Calendar sync flow

- [ ] **Documentation**
  - API_CONTRACT.md - Keep updated
  - KEYWORDS_AI_SETUP.md - Setup guide
  - DEMO_SCRIPT.md - Demo walkthrough

### Key Files to Modify
- `backend/services/keywords_ai_service.py` - Real API calls
- `backend/services/calendar_service.py` - OAuth + API
- `docs/*.md` - Documentation

---

## Shared Responsibilities

### Before Merging
- [ ] Test your component in isolation
- [ ] Test integration with other components
- [ ] Update any mock data you were using
- [ ] Add error handling

### Communication
- Slack/Discord for quick questions
- Update this file when tasks complete
- Flag blockers immediately

### Git Workflow
```bash
git checkout -b feature/your-task
# make changes
git add .
git commit -m "feat: description"
git push origin feature/your-task
# create PR for review
```

---

## Integration Points

| From | To | Endpoint | Owner |
|------|-----|----------|-------|
| Extension | Backend | POST /api/activity | A → B |
| Frontend | Backend | POST /api/chat | C → D |
| Frontend | Backend | GET /api/predictions | C → B |
| Frontend | Backend | GET/POST /api/calendar | C → D |
| Backend | Ollama | Local HTTP | B |
| Backend | Keywords AI | HTTPS | D |
| Backend | Google Calendar | OAuth + API | D |
