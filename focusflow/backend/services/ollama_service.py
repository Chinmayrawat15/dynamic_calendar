"""
Ollama Service - Local LLM integration for pattern analysis.

This service handles communication with the local Ollama instance.
Used for sensitive data analysis that shouldn't leave the local machine.
"""

import httpx
from typing import Optional
from config import settings


class OllamaService:
    """Service for interacting with local Ollama LLM."""

    def __init__(self):
        self.base_url = settings.ollama_host
        self.model = settings.ollama_model

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:
        """
        Generate a response from Ollama.

        TODO: Person B - Implement real Ollama API calls

        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt for context
            temperature: Sampling temperature (0-1)

        Returns:
            Generated text response
        """
        # TODO: Person B - Implement real Ollama call
        # async with httpx.AsyncClient() as client:
        #     response = await client.post(
        #         f"{self.base_url}/api/generate",
        #         json={
        #             "model": self.model,
        #             "prompt": prompt,
        #             "system": system_prompt,
        #             "options": {"temperature": temperature},
        #             "stream": False
        #         },
        #         timeout=60.0
        #     )
        #     response.raise_for_status()
        #     return response.json()["response"]

        # STUB: Return mock response
        print(f"🦙 Ollama generate (mock): {prompt[:50]}...")
        return "This is a mock Ollama response. Implement real API call in ollama_service.py"

    async def analyze_patterns(self, activities: list[dict]) -> dict:
        """
        Analyze activity patterns using local LLM.

        TODO: Person B - Implement pattern analysis

        Args:
            activities: List of activity records

        Returns:
            Analysis results including patterns and suggestions
        """
        # TODO: Person B - Create analysis prompt and call Ollama
        # prompt = f"""Analyze these work activities and identify patterns:
        # {json.dumps(activities, indent=2)}
        #
        # Provide:
        # 1. Main productivity patterns
        # 2. Distraction triggers
        # 3. Suggestions for improvement
        # """
        # response = await self.generate(prompt, system_prompt="You are a productivity analyst.")
        # return {"analysis": response}

        # STUB: Return mock analysis
        print(f"🦙 Analyzing {len(activities)} activities (mock)")
        return {
            "patterns": [
                "Most productive between 9-11 AM",
                "Frequent context switching in afternoon",
                "Social media tends to follow difficult tasks"
            ],
            "suggestions": [
                "Schedule complex tasks in morning",
                "Take short breaks to reduce context switching",
                "Consider blocking distracting sites during focus time"
            ],
            "distraction_triggers": [
                "Slack notifications",
                "Email after lunch",
                "Social media"
            ]
        }

    async def categorize_task(self, task_name: str, activities: list[dict]) -> str:
        """
        Automatically categorize a task based on its name and activities.

        TODO: Person B - Implement task categorization

        Args:
            task_name: Name of the task
            activities: Related activities

        Returns:
            Task category (coding, writing, meeting, etc.)
        """
        # TODO: Person B - Implement categorization logic
        # prompt = f"""Categorize this task into one of these categories:
        # coding, writing, meeting, research, design, review, admin, other
        #
        # Task: {task_name}
        # Websites visited: {[a['domain'] for a in activities]}
        # """
        # return await self.generate(prompt)

        # STUB: Simple keyword-based categorization
        task_lower = task_name.lower()
        if any(kw in task_lower for kw in ["code", "bug", "feature", "implement", "debug"]):
            return "coding"
        elif any(kw in task_lower for kw in ["write", "doc", "blog", "article"]):
            return "writing"
        elif any(kw in task_lower for kw in ["meet", "call", "standup", "sync"]):
            return "meeting"
        elif any(kw in task_lower for kw in ["research", "learn", "explore"]):
            return "research"
        elif any(kw in task_lower for kw in ["design", "ui", "ux", "mockup"]):
            return "design"
        elif any(kw in task_lower for kw in ["review", "pr", "feedback"]):
            return "review"
        else:
            return "other"

    async def health_check(self) -> bool:
        """
        Check if Ollama is running and the model is available.

        Returns:
            True if healthy, False otherwise
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags", timeout=5.0)
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    return any(m["name"].startswith(self.model.split(":")[0]) for m in models)
        except Exception as e:
            print(f"Ollama health check failed: {e}")
        return False
