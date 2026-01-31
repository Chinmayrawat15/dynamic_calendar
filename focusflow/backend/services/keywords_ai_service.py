"""
Keywords AI Service - Cloud LLM integration for user-facing chat.

This service handles communication with the Keywords AI gateway.
Used for user-facing chat interactions where cloud processing is acceptable.
"""

import httpx
from typing import Optional
from config import settings
from models import ChatContext, ChatResponse


class KeywordsAIService:
    """Service for interacting with Keywords AI."""

    def __init__(self):
        self.api_key = settings.keywords_ai_api_key
        self.base_url = settings.keywords_ai_base_url

    def _get_headers(self) -> dict:
        """Get headers for API requests."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def _build_system_prompt(self, context: ChatContext) -> str:
        """
        Build system prompt with context.

        TODO: Person D - Optimize this prompt for better responses
        """
        return f"""You are FocusFlow, a productivity assistant. You help users understand their work patterns and improve focus.

Current context:
- User's current task: {context.current_task or "Not specified"}
- Conservativity setting: {context.conservativity:.0%} (0%=aggressive predictions, 100%=conservative)

Guidelines:
- Be concise and actionable
- When discussing predictions, explain how conservativity affects them
- Suggest specific improvements based on patterns
- Keep responses under 3 sentences unless detail is requested
- Use encouraging but not overly enthusiastic tone"""

    async def chat(
        self,
        message: str,
        context: ChatContext,
        temperature: float = 0.7
    ) -> ChatResponse:
        """
        Send a chat message and get a response.

        TODO: Person D - Implement real Keywords AI API call

        Args:
            message: User message
            context: Current context (task, conservativity)
            temperature: Sampling temperature

        Returns:
            ChatResponse with AI response and optional suggestions
        """
        # TODO: Person D - Implement real Keywords AI call
        # async with httpx.AsyncClient() as client:
        #     response = await client.post(
        #         f"{self.base_url}/chat/completions",
        #         headers=self._get_headers(),
        #         json={
        #             "model": "gpt-4o-mini",  # or other model via Keywords AI
        #             "messages": [
        #                 {"role": "system", "content": self._build_system_prompt(context)},
        #                 {"role": "user", "content": message}
        #             ],
        #             "temperature": temperature
        #         },
        #         timeout=30.0
        #     )
        #     response.raise_for_status()
        #     data = response.json()
        #     ai_message = data["choices"][0]["message"]["content"]
        #
        #     # Parse suggestions if the AI included them
        #     suggestions = self._extract_suggestions(ai_message)
        #
        #     return ChatResponse(
        #         response=ai_message,
        #         suggestions=suggestions
        #     )

        # STUB: Return mock response (actual implementation in routers/chat.py)
        print(f"🤖 Keywords AI chat (mock): {message[:50]}...")
        return ChatResponse(
            response="This is a mock Keywords AI response. Implement real API call in keywords_ai_service.py",
            suggestions=["Learn more", "Get help", "See examples"]
        )

    async def analyze_productivity(
        self,
        stats: dict,
        context: ChatContext
    ) -> str:
        """
        Get AI analysis of productivity stats.

        TODO: Person D - Implement productivity analysis

        Args:
            stats: Current stats (focus score, hours, etc.)
            context: User context

        Returns:
            Analysis text
        """
        # TODO: Person D - Create analysis prompt
        # prompt = f"""Analyze these productivity metrics and provide brief insights:
        # - Focus Score: {stats['today_focus_score']}/100
        # - Hours Tracked: {stats['hours_tracked_today']}
        # - Prediction Accuracy: {stats['prediction_accuracy_percent']}%
        # - Total Sessions: {stats['total_sessions']}
        #
        # Provide 2-3 actionable insights."""
        #
        # response = await self.chat(prompt, context)
        # return response.response

        # STUB
        return "Your productivity looks good today. Consider taking a break soon to maintain focus."

    def _extract_suggestions(self, response: str) -> Optional[list[str]]:
        """
        Extract suggested actions from AI response.

        TODO: Person D - Implement suggestion extraction or ask AI to format them

        Args:
            response: AI response text

        Returns:
            List of suggestions or None
        """
        # TODO: Implement smarter extraction or structured output
        return None

    async def health_check(self) -> bool:
        """
        Check if Keywords AI is accessible.

        Returns:
            True if healthy, False otherwise
        """
        if not self.api_key:
            print("Keywords AI: No API key configured")
            return False

        try:
            async with httpx.AsyncClient() as client:
                # Simple models endpoint check
                response = await client.get(
                    f"{self.base_url}/models",
                    headers=self._get_headers(),
                    timeout=5.0
                )
                return response.status_code in [200, 401]  # 401 means API is reachable
        except Exception as e:
            print(f"Keywords AI health check failed: {e}")
        return False
