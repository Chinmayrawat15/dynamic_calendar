"""
Chat Router - Handles chatbot interactions via Keywords AI with tool support.

The AI can now execute real actions like:
- Scheduling calendar events
- Getting task predictions
- Fetching productivity stats
- Viewing upcoming events
"""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from datetime import datetime

from models import ChatRequest, ChatResponse, ChatContext
from database import get_db, Activity, Session, Setting
from services.keywords_ai_service import KeywordsAIService
from services.chat_tools import CHAT_TOOLS, ChatToolExecutor

router = APIRouter()


def get_context_stats(db: DBSession) -> dict:
    """Get current stats to provide context to the AI."""
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Today's sessions
    today_sessions = db.query(Session).filter(
        Session.start_time >= today_start
    ).all()

    focus_scores = [s.focus_score for s in today_sessions if s.focus_score is not None]
    avg_focus = sum(focus_scores) / len(focus_scores) if focus_scores else 0

    # Today's activities
    today_activities = db.query(Activity).filter(
        Activity.created_at >= today_start
    ).all()

    total_ms = sum(a.duration_ms for a in today_activities if a.duration_ms)
    hours_tracked = total_ms / (1000 * 60 * 60)

    # Top domains today
    domain_time = {}
    for a in today_activities:
        if a.domain:
            domain_time[a.domain] = domain_time.get(a.domain, 0) + (a.duration_ms or 0)

    top_domains = sorted(domain_time.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "today_sessions": len(today_sessions),
        "avg_focus_score": round(avg_focus, 1),
        "hours_tracked": round(hours_tracked, 2),
        "top_domains": [(d, round(t / (1000 * 60), 1)) for d, t in top_domains]
    }


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: DBSession = Depends(get_db)):
    """
    Process a chat message and return AI response.

    The AI can execute tools to:
    - Schedule calendar events
    - Get task duration predictions
    - Fetch productivity stats
    - View upcoming calendar events
    """
    print(f"💬 Chat message: {request.message}")
    print(f"   Context: task={request.context.current_task}, conservativity={request.context.conservativity}")

    # Get real stats for context
    stats = get_context_stats(db)

    # Create context
    context = ChatContext(
        current_task=request.context.current_task,
        conservativity=request.context.conservativity
    )

    # Initialize services
    service = KeywordsAIService()
    tool_executor = ChatToolExecutor(db)

    # Convert history to API format
    history_messages = [
        {"role": msg.role, "content": msg.content}
        for msg in request.history
    ]

    # First call with tools
    api_response = await service.chat_with_tools(
        message=request.message,
        context=context,
        tools=CHAT_TOOLS,
        stats=stats,
        history=history_messages
    )

    # Check for errors
    if "error" in api_response:
        print(f"❌ API Error: {api_response}")
        return ChatResponse(
            response=api_response.get("content", "Sorry, I encountered an error. Please try again."),
            suggestions=["Try again", "Check connection"]
        )

    # Process the response
    try:
        choice = api_response["choices"][0]
        message_obj = choice["message"]

        # Check if the AI wants to call tools
        if message_obj.get("tool_calls"):
            print(f"🔧 AI wants to call {len(message_obj['tool_calls'])} tool(s)")

            # Build messages for continuation (include history)
            messages = [
                {"role": "system", "content": service._build_system_prompt(context, stats, with_tools=True)},
            ]
            # Add conversation history
            messages.extend(history_messages)
            # Add current exchange
            messages.append({"role": "user", "content": request.message})
            messages.append(message_obj)  # Include the assistant message with tool_calls

            # Execute each tool and collect results
            for tool_call in message_obj["tool_calls"]:
                tool_name = tool_call["function"]["name"]
                tool_args = json.loads(tool_call["function"]["arguments"])

                print(f"   Executing: {tool_name}")
                result = await tool_executor.execute_tool(tool_name, tool_args)

                # Add tool result to messages
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "content": json.dumps(result)
                })

            # Get final response after tool execution
            final_response = await service.continue_with_tool_results(
                messages=messages,
                tools=CHAT_TOOLS
            )

            if "error" in final_response:
                return ChatResponse(
                    response="I executed the action but had trouble generating a response.",
                    suggestions=["What happened?", "Try again"]
                )

            final_content = final_response["choices"][0]["message"]["content"]

            # Generate suggestions based on what tools were used
            tool_names = [tc["function"]["name"] for tc in message_obj["tool_calls"]]
            suggestions = _get_tool_based_suggestions(tool_names)

            return ChatResponse(
                response=final_content,
                suggestions=suggestions
            )

        # No tools called, return direct response
        content = message_obj.get("content", "I'm not sure how to help with that.")
        suggestions = service._extract_suggestions(content, request.message)

        return ChatResponse(
            response=content,
            suggestions=suggestions
        )

    except Exception as e:
        print(f"❌ Error processing response: {e}")
        import traceback
        traceback.print_exc()
        return ChatResponse(
            response="Sorry, I had trouble processing that request. Please try again.",
            suggestions=["Try again", "Ask differently"]
        )


def _get_tool_based_suggestions(tool_names: list) -> list:
    """Generate suggestions based on which tools were used."""
    suggestions = []

    if "create_calendar_event" in tool_names or "schedule_task_with_prediction" in tool_names:
        suggestions = ["View my calendar", "Schedule another task", "Get time prediction"]
    elif "get_upcoming_events" in tool_names:
        suggestions = ["Schedule new event", "What's tomorrow?", "Find free time"]
    elif "get_task_prediction" in tool_names:
        suggestions = ["Schedule this task", "Try different task", "Adjust conservativity"]
    elif "get_productivity_stats" in tool_names:
        suggestions = ["Show this week", "Focus tips", "Schedule review"]
    else:
        suggestions = ["Schedule a task", "Check calendar", "Get prediction"]

    return suggestions
