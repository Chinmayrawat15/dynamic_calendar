"""
Chat Tools - Functions that the AI can call to perform actions.

These tools allow the AI to:
- Schedule calendar events
- Get task duration predictions
- Fetch productivity stats
- View upcoming calendar events
"""

import json
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session as DBSession

from services.calendar_service import CalendarService
from services.prediction_engine import PredictionEngine
from database import Session, Activity, Setting


# Tool definitions for the LLM (OpenAI function calling format)
CHAT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_calendar_event",
            "description": "Create a new event on the user's Google Calendar. Use this when the user wants to schedule a task, meeting, or block time for work.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The title/name of the event"
                    },
                    "start_time": {
                        "type": "string",
                        "description": "Start time in ISO format (e.g., '2024-01-15T14:00:00'). Use the current date if the user says 'today' or 'now'."
                    },
                    "duration_minutes": {
                        "type": "integer",
                        "description": "Duration of the event in minutes. Default to 60 if not specified."
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional description for the event"
                    }
                },
                "required": ["title", "start_time", "duration_minutes"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_task_prediction",
            "description": "Get an AI prediction for how long a task will take based on historical data. Use this when the user asks how long something might take or wants to estimate task duration.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_category": {
                        "type": "string",
                        "description": "The type/category of task (e.g., 'coding', 'writing', 'meeting', 'research')"
                    },
                    "conservativity": {
                        "type": "number",
                        "description": "How conservative the estimate should be (0.0 = aggressive/optimistic, 1.0 = conservative/safe). Default 0.5."
                    }
                },
                "required": ["task_category"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_upcoming_events",
            "description": "Get the user's upcoming calendar events. Use this when the user asks about their schedule, what's coming up, or when they're free.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days_ahead": {
                        "type": "integer",
                        "description": "Number of days to look ahead. Default is 7."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_productivity_stats",
            "description": "Get the user's productivity statistics including focus score, hours tracked, and session data. Use this when the user asks about their productivity, focus, or work patterns.",
            "parameters": {
                "type": "object",
                "properties": {
                    "time_period": {
                        "type": "string",
                        "description": "Time period for stats: 'today', 'week', or 'all'. Default is 'today'."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "schedule_task_with_prediction",
            "description": "Schedule a task on the calendar using AI-predicted duration. Combines prediction and scheduling in one action. Use this when the user wants to schedule something and needs help estimating time.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_name": {
                        "type": "string",
                        "description": "Name of the task to schedule"
                    },
                    "task_category": {
                        "type": "string",
                        "description": "Category for prediction (e.g., 'coding', 'writing', 'meeting')"
                    },
                    "start_time": {
                        "type": "string",
                        "description": "When to start the task (ISO format)"
                    },
                    "conservativity": {
                        "type": "number",
                        "description": "How conservative the time estimate should be (0-1). Default 0.5."
                    }
                },
                "required": ["task_name", "task_category", "start_time"]
            }
        }
    }
]


class ChatToolExecutor:
    """Executes tool calls from the AI."""

    def __init__(self, db: DBSession):
        self.db = db
        self.calendar_service = CalendarService()

    async def execute_tool(self, tool_name: str, arguments: dict) -> dict:
        """Execute a tool and return the result."""
        print(f"🔧 Executing tool: {tool_name} with args: {arguments}")

        try:
            if tool_name == "create_calendar_event":
                return await self._create_calendar_event(arguments)
            elif tool_name == "get_task_prediction":
                return self._get_task_prediction(arguments)
            elif tool_name == "get_upcoming_events":
                return await self._get_upcoming_events(arguments)
            elif tool_name == "get_productivity_stats":
                return self._get_productivity_stats(arguments)
            elif tool_name == "schedule_task_with_prediction":
                return await self._schedule_task_with_prediction(arguments)
            else:
                return {"error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            print(f"❌ Tool execution error: {e}")
            return {"error": str(e)}

    async def _create_calendar_event(self, args: dict) -> dict:
        """Create a calendar event."""
        if not self.calendar_service.is_authenticated():
            return {
                "error": "Not authenticated with Google Calendar. Please authenticate first at /api/calendar/auth"
            }

        title = args.get("title")
        start_time = args.get("start_time")
        duration_minutes = args.get("duration_minutes", 60)
        description = args.get("description")

        # Parse and calculate end time
        try:
            start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            end_dt = start_dt + timedelta(minutes=duration_minutes)
        except Exception as e:
            return {"error": f"Invalid start_time format: {e}"}

        try:
            result = await self.calendar_service.create_event(
                title=title,
                start=start_dt.isoformat(),
                end=end_dt.isoformat(),
                description=description
            )
            return {
                "success": True,
                "message": f"Created event '{title}' on {start_dt.strftime('%B %d at %I:%M %p')} for {duration_minutes} minutes",
                "event_id": result["id"],
                "event_url": result["url"]
            }
        except Exception as e:
            return {"error": f"Failed to create event: {str(e)}"}

    def _get_task_prediction(self, args: dict) -> dict:
        """Get task duration prediction."""
        task_category = args.get("task_category", "general")
        conservativity = args.get("conservativity", 0.5)

        engine = PredictionEngine(self.db)
        prediction = engine.predict(task_category, conservativity)

        return {
            "task_category": task_category,
            "predicted_minutes": prediction.predicted_minutes,
            "confidence": prediction.confidence,
            "based_on_sessions": prediction.based_on_sessions,
            "explanation": prediction.explanation
        }

    async def _get_upcoming_events(self, args: dict) -> dict:
        """Get upcoming calendar events."""
        if not self.calendar_service.is_authenticated():
            return {
                "error": "Not authenticated with Google Calendar",
                "events": []
            }

        days_ahead = args.get("days_ahead", 7)
        start_date = datetime.now().strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

        try:
            events = await self.calendar_service.get_events(start_date, end_date)
            return {
                "events": [
                    {
                        "title": e.title,
                        "start": e.start,
                        "end": e.end
                    }
                    for e in events[:10]  # Limit to 10 events
                ],
                "total_count": len(events),
                "time_range": f"{start_date} to {end_date}"
            }
        except Exception as e:
            return {"error": str(e), "events": []}

    def _get_productivity_stats(self, args: dict) -> dict:
        """Get productivity statistics."""
        time_period = args.get("time_period", "today")

        if time_period == "today":
            start_time = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        elif time_period == "week":
            start_time = datetime.utcnow() - timedelta(days=7)
        else:
            start_time = datetime.min

        # Get sessions
        sessions = self.db.query(Session).filter(
            Session.start_time >= start_time
        ).all()

        # Get activities
        activities = self.db.query(Activity).filter(
            Activity.created_at >= start_time
        ).all()

        # Calculate stats
        if sessions:
            focus_scores = [s.focus_score for s in sessions if s.focus_score]
            avg_focus = sum(focus_scores) / len(focus_scores) if focus_scores else 0
        else:
            avg_focus = 0

        total_ms = sum(a.duration_ms for a in activities if a.duration_ms)
        hours_tracked = total_ms / (1000 * 60 * 60)

        # Get top domains
        domain_time = {}
        for a in activities:
            if a.domain:
                domain_time[a.domain] = domain_time.get(a.domain, 0) + (a.duration_ms or 0)

        top_domains = sorted(domain_time.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "time_period": time_period,
            "total_sessions": len(sessions),
            "average_focus_score": round(avg_focus, 1),
            "hours_tracked": round(hours_tracked, 2),
            "total_activities": len(activities),
            "top_sites": [{"domain": d, "minutes": round(t / 60000, 1)} for d, t in top_domains]
        }

    async def _schedule_task_with_prediction(self, args: dict) -> dict:
        """Schedule a task using AI-predicted duration."""
        task_name = args.get("task_name")
        task_category = args.get("task_category", "general")
        start_time = args.get("start_time")
        conservativity = args.get("conservativity", 0.5)

        # Get prediction
        prediction = self._get_task_prediction({
            "task_category": task_category,
            "conservativity": conservativity
        })

        # Create event with predicted duration
        event_result = await self._create_calendar_event({
            "title": task_name,
            "start_time": start_time,
            "duration_minutes": prediction["predicted_minutes"],
            "description": f"Predicted duration: {prediction['predicted_minutes']} minutes ({prediction['confidence']} confidence)"
        })

        return {
            "prediction": prediction,
            "event": event_result
        }
