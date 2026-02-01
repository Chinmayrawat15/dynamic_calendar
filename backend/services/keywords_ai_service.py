import httpx
import os
import logging
import json
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()

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

async def generate_structured_response(prompt: str, output_schema_description: str) -> dict:
    """
    Call Keywords AI service and expect a JSON response.
    """
    structured_prompt = (
        f"{prompt}\n\nRespond ONLY with valid JSON matching this schema: "
        f"{output_schema_description}. No explanation, no markdown fences, just the raw JSON object."
    )
    
    response_text = await generate_response(structured_prompt)
    
    # Remove any potential markdown fences if the LLM ignores instructions
    response_text = response_text.replace("```json", "").replace("```", "").strip()
    
    try:
        return json.loads(response_text)
    except Exception as e:
        logger.warning(f"Failed to parse JSON response from AI: {e}. Response was: {response_text}")
        return {}
