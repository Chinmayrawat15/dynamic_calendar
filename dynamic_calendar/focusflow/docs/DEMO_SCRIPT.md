# FocusFlow Demo Script

Use this script for the hackathon demo presentation.

## Setup Checklist

Before the demo:

- [ ] Backend running (`cd backend && python main.py`)
- [ ] Frontend running (`cd frontend && npm run dev`)
- [ ] Extension loaded in Chrome
- [ ] Ollama running with llama3.1:8b (`ollama serve`)
- [ ] Keywords AI API key configured
- [ ] Browser tabs ready (GitHub, docs, etc.)

## Demo Flow (5 minutes)

### 1. Introduction (30 seconds)

> "FocusFlow is a productivity tracking tool that uses AI to help you understand your work patterns and predict task durations. It consists of three parts: a Chrome extension for tracking, a dashboard for insights, and AI assistants for analysis."

### 2. Chrome Extension (1 minute)

1. Click the FocusFlow extension icon
2. Show the focus score display
3. Enter a task: "Working on demo feature"
4. Click "Start Tracking"
5. Switch between a few tabs
6. Show the focus score updating
7. Point out the badge color changing

> "The extension tracks which sites you visit and how often you switch tabs. This data is used to calculate your focus score in real-time."

### 3. Dashboard Overview (1 minute)

1. Open the dashboard (localhost:3000)
2. Point out the four stat cards
3. Show the conservativity slider

> "The dashboard shows your productivity at a glance. The conservativity slider is key - it adjusts how our predictions account for real-world variability."

4. Demonstrate the slider:
   - Set to 0%: "At 0%, we use median times - optimistic"
   - Set to 100%: "At 100%, we account for interruptions and bad days"

### 4. AI Chat (1.5 minutes)

1. Click on the chatbot
2. Ask: "How's my focus today?"
3. Show the response and suggestions
4. Click a suggestion: "Predict task duration"
5. Show how conservativity affects the prediction

> "The chatbot uses Keywords AI to provide intelligent insights. Notice how it incorporates your current task and settings into its responses."

### 5. Calendar Integration (30 seconds)

1. Show the calendar component
2. Point out events with predicted durations
3. Show the color coding (green = accurate, yellow = check, red = likely wrong)

> "We integrate with Google Calendar to show your events alongside predicted durations. This helps you plan more realistically."

### 6. Technical Architecture (30 seconds)

> "Under the hood, we use:
> - Chrome Manifest V3 for the extension
> - FastAPI for the backend
> - Local Ollama for sensitive pattern analysis
> - Keywords AI for user-facing chat
> - Next.js for the dashboard
>
> The conservativity feature is what sets us apart - it bridges the gap between optimistic estimates and real-world variability."

## Key Talking Points

### Why Two LLMs?

> "We use Ollama locally for analyzing your activity patterns because that data is sensitive. For the chatbot, we use Keywords AI because it provides better conversational ability and the data shared is less sensitive."

### The Conservativity Feature

> "Most prediction tools give you one number. But we all know things take longer than expected. The conservativity slider lets you choose: are you planning for an ideal day, or accounting for Murphy's Law?"

### Privacy First

> "Your detailed browsing data never leaves your machine. The local Ollama instance analyzes patterns, and only aggregated insights are stored."

## Common Questions

**Q: How accurate are the predictions?**
> "With enough data (20+ sessions), we see 80%+ accuracy when users set conservativity appropriately for their work style."

**Q: Does it work offline?**
> "The extension queues data when offline and syncs when back online. The local Ollama works completely offline."

**Q: What about privacy?**
> "Detailed activity data stays local. We only send aggregated stats to the cloud. The local LLM handles sensitive analysis."

## Fallback Plan

If something breaks:

1. **Backend down**: Show the mock data in frontend, explain it would normally come from API
2. **Extension not working**: Show the popup HTML directly, explain the tracking concept
3. **Ollama not running**: Chat still works via Keywords AI, explain we'd normally use local LLM too
4. **Keywords AI down**: Show mock responses, explain the integration

## Post-Demo

After the demo:
- Share the GitHub repo link
- Mention team members and their contributions
- Thank the judges
