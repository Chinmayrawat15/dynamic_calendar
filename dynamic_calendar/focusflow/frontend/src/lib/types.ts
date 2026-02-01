/**
 * TypeScript types matching the backend API contract.
 * Keep in sync with backend/models.py
 */

// ============================================================
// Activity Types
// ============================================================

export interface ActivityItem {
  url: string;
  domain: string;
  title: string;
  duration_ms: number;
  start_time: number;
  end_time: number;
}

export interface ActivityRequest {
  task_name: string;
  activities: ActivityItem[];
  tab_switches: number;
  focus_score: number;
}

export interface ActivityResponse {
  status: "logged";
  count: number;
}

// ============================================================
// Chat Types
// ============================================================

export interface ChatContext {
  current_task?: string;
  conservativity: number;
}

export interface ChatRequest {
  message: string;
  context: ChatContext;
}

export interface ChatResponse {
  response: string;
  suggestions?: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

// ============================================================
// Prediction Types
// ============================================================

export type Confidence = "low" | "medium" | "high";

export interface PredictionResponse {
  predicted_minutes: number;
  confidence: Confidence;
  based_on_sessions: number;
  explanation: string;
}

// ============================================================
// Stats Types
// ============================================================

export interface StatsResponse {
  today_focus_score: number;
  hours_tracked_today: number;
  prediction_accuracy_percent: number;
  total_sessions: number;
}

// ============================================================
// Calendar Types
// ============================================================

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  predicted_duration?: number;
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
}

export interface CreateEventRequest {
  title: string;
  start: string;
  end: string;
  description?: string;
}

export interface CreateEventResponse {
  event_id: string;
  url: string;
}

// ============================================================
// Settings Types
// ============================================================

export interface SettingsResponse {
  conservativity: number;
  tracked_sites: string[];
}

export interface SettingsUpdateRequest {
  conservativity?: number;
  tracked_sites?: string[];
}

export interface SettingsUpdateResponse {
  status: "updated";
}
