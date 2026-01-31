import httpx
import os
import logging

logger = logging.getLogger(__name__)

KEYWORDS_AI_API_URL = os.getenv("KEYWORDS_AI_API_URL", "https://api.keywordsai.co/api/generate") # Example URL
KEYWORDS_AI_API_KEY = os.getenv("KEYWORDS_AI_API_KEY", "")

async def generate_response(prompt: str, variables: dict = None) -> str:
    """
    Call Keywords AI service.
    """
    if not KEYWORDS_AI_API_KEY:
        logger.warning("KEYWORDS_AI_API_KEY not set. Returning mock response.")
        return f"Mock response for: {prompt[:50]}..."

    headers = {
        "Authorization": f"Bearer {KEYWORDS_AI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "gpt-4o", # Example model, can be configured
        "messages": [{"role": "user", "content": prompt}],
        "variables": variables or {}
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(KEYWORDS_AI_API_URL, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            # Adjust parsing based on actual Keywords AI response structure
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            return str(result)
    except Exception as e:
        logger.error(f"Error calling Keywords AI: {e}")
        return "Error generating response from AI."
