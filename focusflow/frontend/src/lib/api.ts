/**
 * API client for FocusFlow backend.
 * All API calls go through this module.
 */

import type {
  ChatRequest,
  ChatResponse,
  HistoryMessage,
  PredictionResponse,
  StatsResponse,
  CalendarEventsResponse,
  CreateEventRequest,
  CreateEventResponse,
  SettingsResponse,
  SettingsUpdateRequest,
  SettingsUpdateResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Base fetch wrapper with error handling.
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

// ============================================================
// Chat API
// ============================================================

/**
 * Send a chat message and get AI response.
 * TODO: Person C - Add streaming support
 */
export async function sendChatMessage(
  message: string,
  context: { currentTask?: string; conservativity: number },
  history?: HistoryMessage[]
): Promise<ChatResponse> {
  const request: ChatRequest = {
    message,
    context: {
      current_task: context.currentTask,
      conservativity: context.conservativity,
    },
    history: history || [],
  };

  return apiFetch<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// ============================================================
// Predictions API
// ============================================================

/**
 * Get duration prediction for a task category.
 */
export async function getPrediction(
  taskCategory: string,
  conservativity: number
): Promise<PredictionResponse> {
  const params = new URLSearchParams({
    task_category: taskCategory,
    conservativity: conservativity.toString(),
  });

  return apiFetch<PredictionResponse>(`/api/predictions?${params}`);
}

// ============================================================
// Stats API
// ============================================================

/**
 * Get dashboard statistics.
 */
export async function getStats(): Promise<StatsResponse> {
  return apiFetch<StatsResponse>("/api/stats");
}

// ============================================================
// Calendar API
// ============================================================

/**
 * Check if the user is authenticated with Google Calendar.
 */
export async function getCalendarAuthStatus(): Promise<{ authenticated: boolean }> {
  return apiFetch<{ authenticated: boolean }>("/api/calendar/status");
}

/**
 * Get the Google Calendar authentication URL.
 * User should be redirected to this URL to authenticate.
 */
export function getCalendarAuthUrl(): string {
  return `${API_URL}/api/calendar/auth`;
}

/**
 * Get calendar events for a date range.
 */
export async function getCalendarEvents(
  startDate: string,
  endDate: string
): Promise<CalendarEventsResponse> {
  const params = new URLSearchParams({
    start: startDate,
    end: endDate,
  });

  return apiFetch<CalendarEventsResponse>(`/api/calendar?${params}`);
}

/**
 * Create a new calendar event.
 */
export async function createCalendarEvent(
  request: CreateEventRequest
): Promise<CreateEventResponse> {
  return apiFetch<CreateEventResponse>("/api/calendar", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// ============================================================
// Settings API
// ============================================================

/**
 * Get current settings.
 */
export async function getSettings(): Promise<SettingsResponse> {
  return apiFetch<SettingsResponse>("/api/settings");
}

/**
 * Update settings.
 */
export async function updateSettings(
  request: SettingsUpdateRequest
): Promise<SettingsUpdateResponse> {
  return apiFetch<SettingsUpdateResponse>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

// ============================================================
// Health Check
// ============================================================

/**
 * Check if the API is healthy.
 */
export async function checkHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/health");
}
