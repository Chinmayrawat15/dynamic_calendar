# FocusFlow

Productivity tracking with AI-powered predictions.

## Overview

FocusFlow is a productivity tracking application that:
- Tracks web activity via a Chrome extension
- Analyzes patterns using local Ollama (for privacy) and Keywords AI (for chat)
- Predicts task durations based on historical data
- Provides a dashboard with chatbot, calendar, and statistics

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Ollama with llama3.1:8b
- Chrome browser

### Setup

1. Clone and install:
```bash
git clone <repo>
cd focusflow
cp .env.example .env
# Fill in your API keys
```

2. Backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
# API runs at http://localhost:8000
```

3. Frontend:
```bash
cd frontend
npm install
npm run dev
# UI runs at http://localhost:3000
```

4. Extension:
- Go to chrome://extensions
- Enable Developer Mode
- Click "Load unpacked"
- Select the `extension` folder
- Pin the FocusFlow extension for easy access

5. Ollama (for local LLM):
```bash
ollama serve
# In another terminal:
ollama pull llama3.1:8b
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Chrome Ext     │────▶│  FastAPI        │────▶│  SQLite DB      │
│  (Activity)     │     │  Backend        │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
          ┌─────────────────┐       ┌─────────────────┐
          │  Ollama (Local) │       │  Keywords AI    │
          │  Pattern Analysis│       │  User Chat      │
          └─────────────────┘       └─────────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │  Next.js Frontend       │
                    │  Dashboard + Chat       │
                    └─────────────────────────┘
```

## Team Assignments

See [TEAM_TASKS.md](TEAM_TASKS.md) for detailed task assignments.

| Person | Component | Directory |
|--------|-----------|-----------|
| A | Chrome Extension | `/extension` |
| B | Backend + Local LLM | `/backend` |
| C | Frontend | `/frontend` |
| D | Integration + APIs | `/docs` + services |

## API Documentation

See [docs/API_CONTRACT.md](docs/API_CONTRACT.md) for complete API documentation.

## Development

### Running Tests
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:
- `KEYWORDS_AI_API_KEY` - Get from Keywords AI dashboard
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google Cloud Console
- `OLLAMA_HOST` - Usually http://localhost:11434

## Tech Stack

- **Extension**: Chrome Manifest V3, vanilla JS
- **Backend**: FastAPI, SQLite, Python 3.11+
- **Local LLM**: Ollama (llama3.1:8b)
- **Cloud LLM**: Keywords AI (api.keywordsai.co)
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind
- **Calendar**: Google Calendar API

## License

MIT
