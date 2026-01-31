from fastapi import APIRouter, Depends
from backend.schemas import ChatRequest, ChatResponse
from backend.services.keywords_ai_service import generate_response
import re

router = APIRouter()

def sanitize_text(text: str) -> str:
    # Remove URLs
    text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '[URL]', text)
    # Remove emails
    text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[EMAIL]', text)
    return text

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    sanitized_message = sanitize_text(request.message)
    
    # We can also sanitize context if provided
    sanitized_context = {}
    if request.context:
        for k, v in request.context.items():
            if isinstance(v, str):
                sanitized_context[k] = sanitize_text(v)
            else:
                sanitized_context[k] = v
                
    # Prepare prompt
    prompt = f"User: {sanitized_message}\nContext: {sanitized_context}"
    
    response_text = await generate_response(prompt)
    
    # Extract suggestions if possible (naive implementation)
    suggestions = []
    
    return {
        "response": response_text,
        "suggestions": suggestions
    }
