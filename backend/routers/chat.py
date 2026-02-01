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
    
    # Generate suggestions
    suggestions_prompt = (
        f"Original user message: {sanitized_message}\n\n"
        f"AI response: {response_text}\n\n"
        "Based on the above, suggest 1-3 short follow-up actions or questions the user might find useful. "
        "Return ONLY a numbered list, nothing else. Example:\n1. Ask about X\n2. Try Y\n3. Look into Z"
    )
    
    suggestions_text = await generate_response(suggestions_prompt)
    suggestions = []
    
    if suggestions_text and "Error" not in suggestions_text:
        lines = suggestions_text.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Remove leading numbers/dots (e.g. "1. " or "2. ")
            # Find first dot
            parts = line.split('.', 1)
            if len(parts) > 1:
                cleaned = parts[1].strip()
            else:
                cleaned = line.strip()
                
            if cleaned:
                suggestions.append(cleaned)
    
    return {
        "response": response_text,
        "suggestions": suggestions
    }
