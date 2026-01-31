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
    """
    # Log the incoming message
    print(f"💬 Chat message: {request.message}")
    print(f"   Context: task={request.context.current_task}, conservativity={request.context.conservativity}")

    service = KeywordsAIService()
    response = await service.chat(
        message=request.message,
        context=request.context
    )
    return response
