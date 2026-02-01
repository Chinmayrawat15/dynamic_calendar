"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, HistoryMessage } from "@/lib/types";
import { sendChatMessage } from "@/lib/api";

interface ChatBotProps {
  currentTask?: string;
  conservativity: number;
}

export default function ChatBot({ currentTask, conservativity }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your Timely assistant. I can help you understand your productivity patterns and predict task durations. What would you like to know?",
      timestamp: new Date(),
      suggestions: ["How's my focus today?", "Predict task duration", "What should I work on?"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history: HistoryMessage[] = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await sendChatMessage(text, { currentTask, conservativity }, history);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        suggestions: response.suggestions || ["How's my focus?", "Predict duration", "Show stats"],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble connecting to the server. Please make sure the backend is running.",
        timestamp: new Date(),
        suggestions: ["Try again", "Check connection"],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex flex-col max-w-[85%]">
              {message.role === "assistant" && (
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-surface-500">Timekeeper</span>
                  <span className="text-xs text-surface-400">{formatTime(message.timestamp)}</span>
                </div>
              )}

              <div
                className={
                  message.role === "user"
                    ? "message-bubble-user"
                    : "message-bubble-assistant"
                }
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>

              {message.role === "user" && (
                <span className="text-xs text-surface-400 mt-1 text-right px-1">
                  {formatTime(message.timestamp)}
                </span>
              )}

              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 px-1">
                  {message.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      disabled={isLoading}
                      className="text-xs px-3 py-1.5 rounded-full bg-white border border-surface-200 text-surface-600
                                 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700
                                 transition-all duration-200 shadow-sm disabled:opacity-50"
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
          <div className="flex justify-start animate-fade-in">
            <div className="flex flex-col max-w-[85%]">
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm animate-pulse">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-surface-500">Timkeeper</span>
              </div>
              <div className="message-bubble-assistant">
                <div className="flex items-center gap-1.5 py-1">
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-surface-100">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Ask me anything..."
          className="input flex-1"
          disabled={isLoading}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="btn btn-primary px-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
