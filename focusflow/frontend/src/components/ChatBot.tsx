"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/lib/types";

interface ChatBotProps {
  currentTask?: string;
  conservativity: number;
}

/**
 * ChatBot component for AI interactions.
 * TODO: Person C - Wire up real API calls and add streaming
 */
export default function ChatBot({ currentTask, conservativity }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your FocusFlow assistant. I can help you understand your productivity patterns and predict task durations. What would you like to know?",
      timestamp: new Date(),
      suggestions: ["How's my focus today?", "Predict task duration", "What should I work on?"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // TODO: Person C - Replace with real API call
    // const response = await sendChatMessage(text, { currentTask, conservativity });

    // MOCK: Simulate API response
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockResponses: Record<string, { content: string; suggestions: string[] }> = {
      "How's my focus today?": {
        content:
          "Your focus score today is 73/100 - that's good! You've had 12 tab switches in the last hour, which is below average. Keep up the good work!",
        suggestions: ["What's distracting me?", "Tips to improve", "Show detailed stats"],
      },
      "Predict task duration": {
        content: `Based on your history with similar tasks, I'd estimate ${Math.round(45 + 20 * conservativity)} minutes. This accounts for your conservativity setting of ${(conservativity * 100).toFixed(0)}%.`,
        suggestions: ["Add to calendar", "What affects this?", "Show breakdown"],
      },
      "What should I work on?": {
        content:
          "Based on your calendar and productivity patterns, I suggest tackling your most complex task now while your focus is high. You have 'Feature Development' scheduled for 2pm.",
        suggestions: ["Start tracking it", "Show my schedule", "Set a reminder"],
      },
    };

    const mockResponse = mockResponses[text] || {
      content: `I understand you're asking about "${text}". Let me help with that. ${currentTask ? `You're currently working on: ${currentTask}.` : "You haven't started tracking a task yet."}`,
      suggestions: ["Tell me more", "Show stats", "Get predictions"],
    };

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: mockResponse.content,
      timestamp: new Date(),
      suggestions: mockResponse.suggestions,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="text-xs px-2 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask me anything..."
          className="input flex-1"
          disabled={isLoading}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="btn btn-primary disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
