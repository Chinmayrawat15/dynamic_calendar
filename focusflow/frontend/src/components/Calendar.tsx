"use client";

import { useState, useEffect, useCallback } from "react";
import type { CalendarEvent } from "@/lib/types";
import {
  getCalendarEvents,
  getCalendarAuthStatus,
  getCalendarAuthUrl,
} from "@/lib/api";
import GoogleCalendarGrid from "./GoogleCalendarGrid";
import AddEventModal from "./AddEventModal";

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDate, setAddModalDate] = useState<Date | undefined>(undefined);

  const checkAuth = useCallback(async () => {
    try {
      const { authenticated } = await getCalendarAuthStatus();
      setIsAuthenticated(authenticated);
      return authenticated;
    } catch (err) {
      console.error("Failed to check auth status:", err);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);

      const { events: fetchedEvents } = await getCalendarEvents(
        formatLocalDate(startDate),
        formatLocalDate(endDate)
      );

      setEvents(fetchedEvents);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load calendar events");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const authenticated = await checkAuth();
      if (authenticated) {
        await fetchEvents();
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, [checkAuth, fetchEvents]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = window.setInterval(() => {
      fetchEvents();
    }, 60_000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchEvents();
      }
    };

    window.addEventListener("focus", fetchEvents);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", fetchEvents);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAuthenticated, fetchEvents]);

  const handleConnectCalendar = () => {
    window.location.href = getCalendarAuthUrl();
  };

  const handleAddEvent = (date?: Date) => {
    setAddModalDate(date || selectedDate);
    setShowAddModal(true);
  };

  const handleEventAdded = () => {
    fetchEvents();
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  const getConfidenceColor = (predicted?: number, scheduled?: number) => {
    if (!predicted || !scheduled) return "badge-neutral";
    const diff = Math.abs(predicted - scheduled);
    if (diff <= 5) return "badge-success";
    if (diff <= 15) return "badge-warning";
    return "badge-error";
  };

  const getScheduledDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  };

  const upcomingEvents = events
    .filter((event) => new Date(event.start) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .slice(0, 10);

  const groupedEvents = upcomingEvents.reduce((acc, event) => {
    const date = formatDate(event.start);
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  if (isAuthenticated === false) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-6 shadow-soft">
          <svg
            className="w-10 h-10 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-surface-900 mb-2">
          Connect Google Calendar
        </h3>
        <p className="text-surface-500 text-center mb-8 max-w-sm leading-relaxed">
          Connect your Google Calendar to see your events and get AI-powered
          duration predictions.
        </p>
        <button
          onClick={handleConnectCalendar}
          className="btn btn-primary flex items-center gap-3 px-6 py-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Connect Google Calendar
        </button>
      </div>
    );
  }

  if (isLoading && isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <svg
              className="animate-spin h-6 w-6 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-sm text-surface-500 font-medium">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
        {/* Left: Calendar Grid */}
        <div className="min-h-[420px] bg-white/60 backdrop-blur-sm rounded-2xl border border-surface-100 p-5 shadow-soft">
          <GoogleCalendarGrid
            events={events}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onAddEvent={handleAddEvent}
          />
        </div>

        {/* Right: Upcoming Events List */}
        <div className="min-h-[420px] flex flex-col bg-white/60 backdrop-blur-sm rounded-2xl border border-surface-100 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-surface-900">
                Upcoming Events
              </h3>
              <p className="text-xs text-surface-500 mt-0.5">Your schedule at a glance</p>
            </div>
            <button
              onClick={() => fetchEvents()}
              className="icon-btn"
              title="Refresh events"
            >
              <svg
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-danger-50 text-danger-700 rounded-xl text-sm mb-4 border border-danger-200">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-auto space-y-5 pr-1">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <div key={date} className="animate-fade-in-up">
                <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                  {date}
                </h4>
                <div className="space-y-2">
                  {dateEvents.map((event) => {
                    const scheduledMinutes = getScheduledDuration(
                      event.start,
                      event.end
                    );
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl hover:bg-surface-100 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="text-sm text-surface-500 w-16 flex-shrink-0 font-medium">
                          {formatTime(event.start)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-surface-900 truncate group-hover:text-primary-700 transition-colors">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-xs text-surface-500 bg-surface-100 px-2 py-0.5 rounded-md">
                              {scheduledMinutes}m
                            </span>
                            {event.predicted_duration && (
                              <span className={`badge ${getConfidenceColor(event.predicted_duration, scheduledMinutes)}`}>
                                ~{event.predicted_duration}m predicted
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {upcomingEvents.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-surface-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-surface-600 font-medium">No upcoming events</p>
                <p className="text-surface-400 text-sm mt-1">Your schedule is clear</p>
              </div>
            )}
          </div>

          <button
            onClick={() => handleAddEvent()}
            className="mt-4 w-full btn btn-secondary group"
          >
            <svg
              className="w-4 h-4 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Event
          </button>
        </div>
      </div>

      <AddEventModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onEventAdded={handleEventAdded}
        defaultDate={addModalDate}
      />
    </>
  );
}
