# Keywords AI Setup Guide

This guide explains how to set up Keywords AI for the FocusFlow chatbot.

## What is Keywords AI?

Keywords AI is an LLM gateway that provides:
- Unified API for multiple LLM providers
- Request logging and analytics
- Cost tracking
- Fallback handling

We use it for user-facing chat interactions where cloud processing is acceptable.

## Getting Your API Key

1. Go to [platform.keywordsai.co](https://platform.keywordsai.co)
2. Sign up or log in
3. Navigate to **API Keys** in the dashboard
4. Click **Create New Key**
5. Copy the key (starts with `kw_`)

## Configuration

Add your API key to the `.env` file:

```bash
KEYWORDS_AI_API_KEY=kw_your_api_key_here
```

## API Usage

Keywords AI uses the OpenAI-compatible API format:

```python
import httpx

response = await httpx.post(
    "https://api.keywordsai.co/api/chat/completions",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    },
    json={
        "model": "gpt-4o-mini",  # or other models
        "messages": [
            {"role": "system", "content": "You are FocusFlow..."},
            {"role": "user", "content": "How's my focus today?"}
        ],
        "temperature": 0.7
    }
)
```

## Recommended Models

For FocusFlow, we recommend:

| Model | Use Case | Cost |
|-------|----------|------|
| gpt-4o-mini | General chat | $ |
| gpt-4o | Complex analysis | $$$ |
| claude-3-haiku | Fast responses | $ |

## System Prompt

Use this system prompt for the FocusFlow assistant:

```
You are FocusFlow, a productivity assistant. You help users understand their work patterns and improve focus.

Current context:
- User's current task: {task}
- Conservativity setting: {conservativity}% (0%=aggressive predictions, 100%=conservative)

Guidelines:
- Be concise and actionable
- When discussing predictions, explain how conservativity affects them
- Suggest specific improvements based on patterns
- Keep responses under 3 sentences unless detail is requested
- Use encouraging but not overly enthusiastic tone
```

## Testing

Test your setup with curl:

```bash
curl -X POST https://api.keywordsai.co/api/chat/completions \
  -H "Authorization: Bearer $KEYWORDS_AI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Error Handling

Common errors:

| Error | Cause | Solution |
|-------|-------|----------|
| 401 | Invalid API key | Check your key is correct |
| 429 | Rate limit | Add retry logic |
| 500 | Server error | Use fallback model |

## Fallback Strategy

Implement fallbacks for reliability:

```python
async def chat_with_fallback(message):
    models = ["gpt-4o-mini", "claude-3-haiku", "gpt-3.5-turbo"]

    for model in models:
        try:
            return await call_keywords_ai(model, message)
        except Exception as e:
            print(f"Model {model} failed: {e}")
            continue

    raise Exception("All models failed")
```

## Cost Management

Monitor costs in the Keywords AI dashboard:
- Set up alerts for spending thresholds
- Use cheaper models for simple queries
- Cache common responses

## Security Notes

- Never commit API keys to git
- Use environment variables
- Rotate keys periodically
- Monitor for unusual usage
