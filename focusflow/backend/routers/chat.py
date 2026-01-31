"""
Chat Router - Handles chatbot interactions via Keywords AI.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from models import ChatRequest, ChatResponse
from database import get_db
from services.keywords_ai_service import KeywordsAIService

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: DBSession = Depends(get_db)):
    """
    Process a chat message and return AI response.

    Uses Keywords AI for user-facing chat interactions.
    Context includes current task and conservativity setting.

    TODO: Person D - Replace mock with real Keywords AI calls
    """
    # STUB: Log the incoming message
    print(f"💬 Chat message: {request.message}")
    print(f"   Context: task={request.context.current_task}, conservativity={request.context.conservativity}")

    # TODO: Person D - Call Keywords AI service
    # service = KeywordsAIService()
    # response = await service.chat(
    #     message=request.message,
    #     context=request.context
    # )
    # return response

    # MOCK: Return helpful stub responses based on message
    message_lower = request.message.lower()

    if "predict" in message_lower or "how long" in message_lower:
        return ChatResponse(
            response="Based on your history, similar tasks usually take about 45-60 minutes. With your current conservativity setting of {:.0%}, I'd estimate 52 minutes.".format(request.context.conservativity),
            suggestions=["Show me the breakdown", "What affects this?", "Add to calendar"]
        )
    elif "focus" in message_lower or "distract" in message_lower:
        return ChatResponse(
            response="Your focus score today is 73/100. You've had 12 tab switches in the last hour. Consider closing unnecessary tabs to improve focus.",
            suggestions=["What's distracting me?", "Tips to improve", "Set focus mode"]
        )
    elif "schedule" in message_lower or "calendar" in message_lower:
        return ChatResponse(
            response="I can help you schedule tasks. What would you like to add to your calendar?",
            suggestions=["Schedule current task", "Show my week", "Find free time"]
        )
    else:
        return ChatResponse(
            response=f"I'm FocusFlow, your productivity assistant. I can help you track focus, predict task durations, and manage your schedule. You're currently working on: {request.context.current_task or 'No task set'}",
            suggestions=["How's my focus today?", "Predict task duration", "What should I work on?"]
        )
