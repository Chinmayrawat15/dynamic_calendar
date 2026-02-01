"use client";

import { useState, useEffect, useCallback } from "react";
import { getCalendarEvents, createCalendarEvent } from "@/lib/api";
import type { CalendarEvent } from "@/lib/types";

/**
 * Calendar component with real API integration
 */
export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", start: "", end: "" });
  const [isCreating, setIsCreating] = useState(false);

  // Fetch calendar events
  const fetchEvents = useCallback(async () => {
    try {
      // Get events for the next 7 days
      const startDate = new Date().toISOString().split("T")[0];
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const response = await getCalendarEvents(startDate, endDate);
      setEvents(response?.events || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch calendar events:", err);
      setError("Unable to load calendar events");
      // Use mock data as fallback
      setEvents([
        {
          id: "evt_1",
          title: "Team Standup",
          start: new Date().toISOString(),
          end: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          predicted_duration: 25,
        },
        {
          id: "evt_2",
          title: "Code Review Session",
          start: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
          predicted_duration: 55,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Format time for display
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format date for display
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

  // Get confidence badge color
  const getConfidenceColor = (predicted?: number, scheduled?: number) => {
    if (!predicted || !scheduled) return "bg-gray-100 text-gray-600";
    const diff = Math.abs(predicted - scheduled);
    if (diff <= 5) return "bg-green-100 text-green-700";
    if (diff <= 15) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  // Calculate scheduled duration
  const getScheduledDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  };

  // Group events by date
  const groupedEvents = (events || []).reduce((acc, event) => {
    const date = formatDate(event.start);
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  // Handle create event
  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) return;

    setIsCreating(true);
    try {
      await createCalendarEvent({
        title: newEvent.title,
        start: new Date(newEvent.start).toISOString(),
        end: new Date(newEvent.end).toISOString(),
      });
      setShowAddModal(false);
      setNewEvent({ title: "", start: "", end: "" });
      fetchEvents(); // Refresh events
    } catch (err) {
      console.error("Failed to create event:", err);
    } finally {
      setIsCreating(false);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="space-y-2">
              <div className="h-16 bg-gray-100 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {error && (
        <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={fetchEvents} className="text-yellow-800 hover:text-yellow-900 font-medium">
            Retry
          </button>
        </div>
      )}

      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date} className="animate-fadeIn">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">{date}</h3>
          <div className="space-y-2">
            {dateEvents.map((event) => {
              const scheduledMinutes = getScheduledDuration(event.start, event.end);
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all cursor-pointer hover:shadow-sm group"
                >
                  {/* Time */}
                  <div className="text-sm text-gray-500 w-20 flex-shrink-0">
                    {formatTime(event.start)}
                  </div>

                  {/* Event details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">
                        {scheduledMinutes} min scheduled
                      </span>
                      {event.predicted_duration && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full transition-all ${getConfidenceColor(
                            event.predicted_duration,
                            scheduledMinutes
                          )}`}
                        >
                          ~{event.predicted_duration} min predicted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {(events || []).length === 0 && !error && (
        <div className="text-center py-8 text-gray-400 animate-fadeIn">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No upcoming events</p>
        </div>
      )}

      {/* Add Event Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full btn btn-secondary text-sm hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all group"
      >
        <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Event
      </button>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 animate-slideUp">
            <h3 className="text-lg font-semibold mb-4">Add New Event</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g., Team Meeting"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.start}
                    onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.end}
                    onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={!newEvent.title || !newEvent.start || !newEvent.end || isCreating}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
