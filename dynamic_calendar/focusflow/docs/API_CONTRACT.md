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

### Time Spent (Website Tracking)

#### GET /api/time-spent

Get aggregated time spent on websites for a date range.

**Query Parameters:**
- `start` (optional): Start date (YYYY-MM-DD). Defaults to today.
- `end` (optional): End date (YYYY-MM-DD). Defaults to today.
- `group_by` (optional): Grouping method - `domain`, `category`, or `hour`. Defaults to `domain`.

**Request:**
```
GET /api/time-spent?start=2026-01-25&end=2026-01-31&group_by=domain
```

**Response:**
```json
{
  "period": {
    "start": "2026-01-25",
    "end": "2026-01-31"
  },
  "total_time_seconds": 28500,
  "total_visits": 136,
  "sites": [
    {
      "id": 1,
      "domain": "github.com",
      "favicon_url": "https://github.com/favicon.ico",
      "time_spent_seconds": 7200,
      "category": "Development",
      "visits": 45,
      "last_visited": "2026-01-31T14:30:00Z"
    },
    {
      "id": 2,
      "domain": "stackoverflow.com",
      "favicon_url": "https://stackoverflow.com/favicon.ico",
      "time_spent_seconds": 3600,
      "category": "Development",
      "visits": 23,
      "last_visited": "2026-01-31T12:15:00Z"
    }
  ],
  "by_category": {
    "Development": 10800,
    "Productivity": 7200,
    "Entertainment": 7800,
    "Social Media": 2700
  }
}
```

#### GET /api/time-spent/summary

Get a quick summary of today's browsing activity.

**Response:**
```json
{
  "date": "2026-01-31",
  "total_time_seconds": 14400,
  "total_visits": 68,
  "top_sites": [
    {
      "domain": "github.com",
      "time_spent_seconds": 3600,
      "category": "Development"
    },
    {
      "domain": "notion.so",
      "time_spent_seconds": 2700,
      "category": "Productivity"
    },
    {
      "domain": "youtube.com",
      "time_spent_seconds": 2400,
      "category": "Entertainment"
    }
  ],
  "top_category": "Development",
  "productive_time_seconds": 9000,
  "distracted_time_seconds": 5400
}
```

#### POST /api/time-spent/log

Log browsing activity from the Chrome extension. Called periodically (every 30 seconds) with batched data.

**Request:**
```json
{
  "entries": [
    {
      "url": "https://github.com/user/repo/pull/123",
      "domain": "github.com",
      "title": "Pull Request #123 - Feature Implementation",
      "favicon_url": "https://github.com/favicon.ico",
      "start_time": 1706700000000,
      "end_time": 1706700045000,
      "duration_ms": 45000,
      "is_active": true
    },
    {
      "url": "https://stackoverflow.com/questions/12345",
      "domain": "stackoverflow.com",
      "title": "How to implement X in TypeScript?",
      "favicon_url": "https://stackoverflow.com/favicon.ico",
      "start_time": 1706700045000,
      "end_time": 1706700090000,
      "duration_ms": 45000,
      "is_active": true
    }
  ],
  "extension_version": "1.0.0",
  "browser": "chrome"
}
```

**Response:**
```json
{
  "status": "logged",
  "entries_processed": 2,
  "timestamp": "2026-01-31T14:30:00Z"
}
```

#### GET /api/time-spent/categories

Get the list of available categories and their associated domains.

**Response:**
```json
{
  "categories": [
    {
      "name": "Development",
      "color": "#3B82F6",
      "domains": ["github.com", "stackoverflow.com", "gitlab.com", "bitbucket.org"],
      "is_productive": true
    },
    {
      "name": "Productivity",
      "color": "#10B981",
      "domains": ["notion.so", "docs.google.com", "trello.com", "asana.com"],
      "is_productive": true
    },
    {
      "name": "Entertainment",
      "color": "#8B5CF6",
      "domains": ["youtube.com", "netflix.com", "twitch.tv", "reddit.com"],
      "is_productive": false
    },
    {
      "name": "Social Media",
      "color": "#F97316",
      "domains": ["twitter.com", "linkedin.com", "facebook.com", "instagram.com"],
      "is_productive": false
    },
    {
      "name": "Communication",
      "color": "#06B6D4",
      "domains": ["slack.com", "discord.com", "mail.google.com", "outlook.com"],
      "is_productive": true
    },
    {
      "name": "Other",
      "color": "#6B7280",
      "domains": [],
      "is_productive": null
    }
  ]
}
```

#### PUT /api/time-spent/categories

Update category assignments for domains.

**Request:**
```json
{
  "domain": "notion.so",
  "category": "Productivity"
}
```

**Response:**
```json
{
  "status": "updated",
  "domain": "notion.so",
  "category": "Productivity"
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

### TimeSpentEntry (from Chrome Extension)
| Field | Type | Description |
|-------|------|-------------|
| url | string | Full URL of the page visited |
| domain | string | Domain name (e.g., "github.com") |
| title | string | Page title |
| favicon_url | string? | URL to the site's favicon |
| start_time | integer | Unix timestamp (ms) when visit started |
| end_time | integer | Unix timestamp (ms) when visit ended |
| duration_ms | integer | Time spent on page in milliseconds |
| is_active | boolean | Whether the tab was actively focused |

### TimeSpentSite (aggregated)
| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique site ID |
| domain | string | Domain name |
| favicon_url | string? | URL to the site's favicon |
| time_spent_seconds | integer | Total time spent in seconds |
| category | string | Category (Development, Productivity, etc.) |
| visits | integer | Number of visits |
| last_visited | string | ISO 8601 datetime of last visit |

### TimeSpentCategory
| Field | Type | Description |
|-------|------|-------------|
| name | string | Category name |
| color | string | Hex color code for UI display |
| domains | string[] | List of domains in this category |
| is_productive | boolean? | Whether this category is considered productive |

### Category Names
One of: `"Development"`, `"Productivity"`, `"Entertainment"`, `"Social Media"`, `"Communication"`, `"Other"`

---

## Rate Limits

No rate limits implemented yet. For production, consider:
- 100 requests/minute per IP
- 1000 requests/hour per API key

---

## Implementation Status

| Endpoint | Status | Notes |
|----------|--------|-------|
| POST /api/activity | ⚠️ Stub | Needs database storage |
| POST /api/chat | ✅ Functional | Uses Keywords AI |
| GET /api/predictions | ⚠️ Stub | Needs real prediction engine |
| GET /api/stats | ⚠️ Stub | Needs real database queries |
| GET /api/calendar | ⚠️ Stub | Needs Google Calendar integration |
| POST /api/calendar | ⚠️ Stub | Needs Google Calendar integration |
| GET /api/settings | ✅ Functional | Database-backed |
| PUT /api/settings | ✅ Functional | Database-backed |
| GET /api/time-spent | 🔴 Not Implemented | Chrome extension integration |
| GET /api/time-spent/summary | 🔴 Not Implemented | Chrome extension integration |
| POST /api/time-spent/log | 🔴 Not Implemented | Chrome extension integration |
| GET /api/time-spent/categories | 🔴 Not Implemented | Category management |
| PUT /api/time-spent/categories | 🔴 Not Implemented | Category management |

**Legend:** ✅ Functional | ⚠️ Stub/Mock | 🔴 Not Implemented

---

## Chrome Extension Integration

The Chrome extension should:

1. **Track active tab changes** - Monitor when the user switches tabs
2. **Batch activity data** - Collect entries and send every 30 seconds via `POST /api/time-spent/log`
3. **Handle idle detection** - Pause tracking when user is idle (configurable threshold)
4. **Store offline data** - Queue entries when offline and sync when back online
5. **Respect user preferences** - Honor blocked sites and tracking settings from `GET /api/settings`

### Extension → Backend Flow

```
[Chrome Extension]
       │
       ├── On tab change: Record start/end times
       ├── Every 30s: Batch entries
       │
       ▼
POST /api/time-spent/log
       │
       ▼
[Backend aggregates data]
       │
       ▼
GET /api/time-spent ← [Frontend Time Spent page]
```

### Recommended Extension Storage Format

```javascript
// chrome.storage.local
{
  "pendingEntries": [...],     // Entries waiting to be sent
  "lastSyncTime": 1706700000,  // Last successful sync timestamp
  "currentEntry": {            // Currently active tab
    "url": "...",
    "domain": "...",
    "title": "...",
    "startTime": 1706700000
  },
  "settings": {
    "trackingEnabled": true,
    "idleThresholdMinutes": 5,
    "syncIntervalSeconds": 30
  }
}
```
