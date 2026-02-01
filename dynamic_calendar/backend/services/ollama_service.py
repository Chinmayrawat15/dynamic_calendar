import httpx
import logging

logger = logging.getLogger(__name__)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.1:8b"

async def analyze_pattern(prompt: str) -> str:
    """
    Call local Ollama to analyze patterns.
    Ensure input is sanitized before calling this.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False
            }
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            result = response.json()
            return result.get("response", "")
    except httpx.RequestError as exc:
        logger.error(f"An error occurred while requesting {exc.request.url!r}.")
        return "Error analyzing pattern with Ollama."
    except httpx.HTTPStatusError as exc:
        logger.error(f"Error response {exc.response.status_code} while requesting {exc.request.url!r}.")
        return "Error analyzing pattern with Ollama."
    except Exception as e:
        logger.error(f"Unexpected error in Ollama service: {e}")
        return "Error analyzing pattern with Ollama."
