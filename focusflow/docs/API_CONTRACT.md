# FocusFlow API Contract

Base URL: `http://localhost:8000`

## Authentication

Currently no authentication is required. In production, implement API key or JWT authentication.

---

## Endpoints

### Activity

#### POST /api/activity

Log activity data from the Chrome extension.

**Request:**
```json
{
  "task_name": "Feature development",
  "activities": [
    {
      "url": "https://github.com/user/repo",
      "domain": "github.com",
      "title": "Pull Request #123",
      "duration_ms": 45000,
      "start_time": 1706700000000,
      "end_time": 1706700045000
    }
  ],
  "tab_switches": 5,
  "focus_score": 85.0
}
```

**Response:**
```json
{
  "status": "logged",
  "count": 1
}
```

---

### Chat

#### POST /api/chat

Send a message to the AI assistant.

**Request:**
```json
{
  "message": "How's my focus today?",
  "context": {
    "current_task": "Feature development",
    "conservativity": 0.5
  }
}
```

**Response:**
```json
{
  "response": "Your focus score today is 73/100...",
  "suggestions": ["What's distracting me?", "Tips to improve"]
}
```

---

### Predictions

#### GET /api/predictions

Get duration prediction for a task category.

**Query Parameters:**
- `task_category` (required): Category of task (e.g., "coding", "writing")
- `conservativity` (optional, default 0.5): 0=aggressive, 1=conservative

**Request:**
```
GET /api/predictions?task_category=coding&conservativity=0.5
```

**Response:**
```json
{
  "predicted_minutes": 52,
  "confidence": "high",
  "based_on_sessions": 23,
  "explanation": "Based on 23 previous 'coding' sessions..."
}
```

**Confidence Levels:**
- `high`: 20+ sessions
- `medium`: 10-19 sessions
- `low`: <10 sessions

---

### Statistics

#### GET /api/stats

Get dashboard statistics.

**Response:**
```json
{
  "today_focus_score": 73.5,
  "hours_tracked_today": 4.5,
  "prediction_accuracy_percent": 82.3,
  "total_sessions": 47
}
```

---

### Calendar

#### GET /api/calendar

Get calendar events for a date range.

**Query Parameters:**
- `start` (required): Start date (YYYY-MM-DD)
- `end` (required): End date (YYYY-MM-DD)

**Request:**
```
GET /api/calendar?start=2026-01-31&end=2026-02-07
```

**Response:**
```json
{
  "events": [
    {
      "id": "evt_123",
      "title": "Team Standup",
      "start": "2026-01-31T09:00:00Z",
      "end": "2026-01-31T09:30:00Z",
      "predicted_duration": 25
    }
  ]
}
```

#### POST /api/calendar

Create a new calendar event.

**Request:**
```json
{
  "title": "Code Review",
  "start": "2026-01-31T14:00:00Z",
  "end": "2026-01-31T15:00:00Z",
  "description": "Review PR #456"
}
```

**Response:**
```json
{
  "event_id": "evt_789",
  "url": "https://calendar.google.com/calendar/event?eid=..."
}
```

---

### Settings

#### GET /api/settings

Get current user settings.

**Response:**
```json
{
  "conservativity": 0.5,
  "tracked_sites": ["github.com", "stackoverflow.com"]
}
```

#### PUT /api/settings

Update user settings. Partial updates supported.

**Request:**
```json
{
  "conservativity": 0.7,
  "tracked_sites": ["github.com", "stackoverflow.com", "docs.google.com"]
}
```

**Response:**
```json
{
  "status": "updated"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "detail": "Error message here"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

---

## Data Types

### ActivityItem
| Field | Type | Description |
|-------|------|-------------|
| url | string | Full URL of the page |
| domain | string | Domain name only |
| title | string | Page title |
| duration_ms | integer | Time spent in milliseconds |
| start_time | integer | Unix timestamp (ms) |
| end_time | integer | Unix timestamp (ms) |

### CalendarEvent
| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique event ID |
| title | string | Event title |
| start | string | ISO 8601 datetime |
| end | string | ISO 8601 datetime |
| predicted_duration | integer? | Predicted duration in minutes |

### Confidence
One of: `"low"`, `"medium"`, `"high"`

---

## Rate Limits

No rate limits implemented yet. For production, consider:
- 100 requests/minute per IP
- 1000 requests/hour per API key
