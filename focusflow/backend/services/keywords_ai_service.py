"""
Keywords AI Service - Cloud LLM integration for user-facing chat.

This service handles communication with the Keywords AI gateway.
Supports function calling for calendar scheduling and productivity tools.
"""

import httpx
import json
from typing import Optional, List
from datetime import datetime
from config import settings
from models import ChatContext, ChatResponse


class KeywordsAIService:
    """Service for interacting with Keywords AI with function calling support."""

    def __init__(self):
        self.api_key = settings.keywords_ai_api_key
        self.base_url = settings.keywords_ai_base_url

    def _get_headers(self) -> dict:
        """Get headers for API requests."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def _build_system_prompt(self, context: ChatContext, stats: Optional[dict] = None, with_tools: bool = False) -> str:
        """Build system prompt with context, stats, and tool guidance."""
        conservativity_label = "aggressive" if context.conservativity < 0.3 else "conservative" if context.conservativity > 0.7 else "balanced"
        current_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        current_date = datetime.now().strftime("%A, %B %d, %Y")

        if with_tools:
            prompt = f"""You are FocusFlow, a productivity assistant with the ability to schedule events and analyze productivity.

IMPORTANT: You have access to tools that can perform REAL actions. USE THEM when appropriate:
- When users want to schedule something → use create_calendar_event or schedule_task_with_prediction
- When users ask about their schedule → use get_upcoming_events
- When users ask how long a task takes → use get_task_prediction
- When users ask about productivity/focus → use get_productivity_stats

Current date and time: {current_date}, {current_time}
User's current task: {context.current_task or "Not specified"}
Prediction mode: {conservativity_label} ({context.conservativity:.0%})"""
        else:
            prompt = f"""You are FocusFlow, a productivity assistant. You help users understand their work patterns and improve focus.

Current date and time: {current_date}, {current_time}
User's current task: {context.current_task or "Not specified"}
Prediction mode: {conservativity_label} ({context.conservativity:.0%})
  - Aggressive (0%): Uses median time estimates, optimistic
  - Conservative (100%): Uses 90th percentile, accounts for delays"""

        if stats:
            prompt += f"""

Live productivity data:
- Sessions today: {stats.get('today_sessions', 0)}
- Focus score: {stats.get('avg_focus_score', 0)}/100
- Hours tracked: {stats.get('hours_tracked', 0):.1f}"""

            if stats.get('top_domains'):
                domains_str = ", ".join([f"{d[0]} ({d[1]}min)" for d in stats['top_domains'][:3]])
                prompt += f"\n- Top sites: {domains_str}"

        if with_tools:
            prompt += """

Guidelines:
- ALWAYS use tools when the user wants to take an action (schedule, check calendar, get predictions)
- Be proactive - if user mentions a task, offer to schedule it
- For scheduling: Use predictions to estimate duration, or ask if unclear
- Be concise but helpful
- When creating events, confirm what was created with the details"""
        else:
            prompt += """

Guidelines:
- Be concise and actionable
- When discussing predictions, explain how the conservativity setting affects them
- Provide specific insights based on the user's actual data
- Keep responses under 3 sentences unless detail is requested
- Use an encouraging but professional tone"""

        return prompt

    async def chat_with_tools(
        self,
        message: str,
        context: ChatContext,
        tools: List[dict],
        stats: Optional[dict] = None,
        temperature: float = 0.7,
        history: Optional[List[dict]] = None
    ) -> dict:
        """
        Send a chat message with tool definitions.
        Returns the raw API response including any tool calls.
        """
        if not self.api_key:
            return {
                "error": "Keywords AI API key is not configured",
                "content": "I need an API key to work. Please add KEYWORDS_AI_API_KEY to your .env file."
            }

        try:
            async with httpx.AsyncClient() as client:
                # Build messages with history
                messages = [
                    {"role": "system", "content": self._build_system_prompt(context, stats, with_tools=True)}
                ]
                # Add conversation history
                if history:
                    messages.extend(history)
                # Add current user message
                messages.append({"role": "user", "content": message})

                payload = {
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "tools": tools,
                    "tool_choice": "auto",
                    "temperature": temperature
                }

                print(f"📤 Sending to Keywords AI with {len(tools)} tools")

                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self._get_headers(),
                    json=payload,
                    timeout=60.0
                )
                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            print(f"Keywords AI HTTP Error: {e.response.status_code} - {e.response.text}")
            return {"error": f"API error: {e.response.status_code}", "details": e.response.text}
        except Exception as e:
            print(f"Keywords AI Error: {e}")
            return {"error": str(e)}

    async def continue_with_tool_results(
        self,
        messages: List[dict],
        tools: List[dict],
        temperature: float = 0.7
    ) -> dict:
        """
        Continue conversation after tool execution with results.
        """
        if not self.api_key:
            return {"error": "API key not configured"}

        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "tools": tools,
                    "tool_choice": "auto",
                    "temperature": temperature
                }

                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self._get_headers(),
                    json=payload,
                    timeout=60.0
                )
                response.raise_for_status()
                return response.json()

        except Exception as e:
            print(f"Keywords AI Error: {e}")
            return {"error": str(e)}

    async def chat(
        self,
        message: str,
        context: ChatContext,
        stats: Optional[dict] = None,
        temperature: float = 0.7
    ) -> ChatResponse:
        """
        Simple chat without tools (for backwards compatibility).
        """
        if not self.api_key:
            return ChatResponse(
                response="Keywords AI API key is not configured. Please add KEYWORDS_AI_API_KEY to your .env file.",
                suggestions=["Configure API Key"]
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self._get_headers(),
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": self._build_system_prompt(context, stats)},
                            {"role": "user", "content": message}
                        ],
                        "temperature": temperature
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                ai_message = data["choices"][0]["message"]["content"]

                suggestions = self._extract_suggestions(ai_message, message)

                return ChatResponse(
                    response=ai_message,
                    suggestions=suggestions
                )
        except httpx.HTTPStatusError as e:
            print(f"Keywords AI HTTP Error: {e.response.status_code} - {e.response.text}")
            return ChatResponse(
                response="I encountered an error connecting to the AI service. Please check your API key configuration.",
                suggestions=["Check API Key", "Try Again"]
            )
        except Exception as e:
            print(f"Keywords AI Error: {e}")
            return ChatResponse(
                response="I'm having trouble connecting right now. Please try again in a moment.",
                suggestions=["Retry"]
            )

    def _extract_suggestions(self, response: str, original_message: str) -> Optional[list[str]]:
        """Generate contextual follow-up suggestions."""
        message_lower = original_message.lower()

        if any(word in message_lower for word in ["schedule", "book", "create event", "add event"]):
            return ["View my calendar", "Schedule another", "Get time prediction"]
        elif any(word in message_lower for word in ["focus", "distract", "concentrate"]):
            return ["Show my top distractions", "Tips to improve focus", "Schedule focus time"]
        elif any(word in message_lower for word in ["predict", "estimate", "how long", "duration"]):
            return ["Schedule this task", "Adjust conservativity", "Show similar tasks"]
        elif any(word in message_lower for word in ["stats", "today", "progress", "productivity"]):
            return ["Show detailed breakdown", "Compare to last week", "Schedule review"]
        elif any(word in message_lower for word in ["calendar", "schedule", "event", "meeting"]):
            return ["Schedule new event", "Get time prediction", "View tomorrow"]
        else:
            return ["Schedule a task", "Check my calendar", "How's my focus?"]

    async def health_check(self) -> bool:
        """Check if Keywords AI is accessible."""
        if not self.api_key:
            print("Keywords AI: No API key configured")
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/models",
                    headers=self._get_headers(),
                    timeout=5.0
                )
                return response.status_code in [200, 401]
        except Exception as e:
            print(f"Keywords AI health check failed: {e}")
        return False
