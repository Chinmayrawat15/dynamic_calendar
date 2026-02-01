/**
 * API client for FocusFlow backend.
 * All API calls go through this module.
 */

import type {
  ChatRequest,
  ChatResponse,
  PredictionResponse,
  StatsResponse,
  CalendarEventsResponse,
  CreateEventRequest,
  CreateEventResponse,
  SettingsResponse,
  SettingsUpdateRequest,
  SettingsUpdateResponse,
  GoogleAuthStatusResponse,
  GoogleAuthInitResponse,
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
  context: { currentTask?: string; conservativity: number }
): Promise<ChatResponse> {
  const request: ChatRequest = {
    message,
    context: {
      current_task: context.currentTask,
      conservativity: context.conservativity,
    },
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

/**
 * Check Google Calendar authentication status.
 */
export async function getGoogleAuthStatus(): Promise<GoogleAuthStatusResponse> {
  return apiFetch<GoogleAuthStatusResponse>("/api/calendar/auth/status");
}

/**
 * Initiate Google Calendar OAuth flow.
 */
export async function initiateGoogleAuth(): Promise<GoogleAuthInitResponse> {
  return apiFetch<GoogleAuthInitResponse>("/api/calendar/auth");
}

/**
 * Logout and disconnect Google account.
 */
export async function logout(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/api/calendar/logout", {
    method: "POST",
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
