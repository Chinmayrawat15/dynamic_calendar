"use client";

import { useState, useEffect } from "react";
import type { CalendarEvent } from "@/lib/types";

/**
 * Calendar component showing upcoming events.
 * TODO: Person C - Wire up real API calls and add create event functionality
 */
export default function Calendar() {
  // TODO: Person C - Fetch from /api/calendar
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: "evt_1",
      title: "Team Standup",
      start: "2026-01-31T09:00:00Z",
      end: "2026-01-31T09:30:00Z",
      predicted_duration: 25,
    },
    {
      id: "evt_2",
      title: "Code Review Session",
      start: "2026-01-31T10:00:00Z",
      end: "2026-01-31T11:00:00Z",
      predicted_duration: 55,
    },
    {
      id: "evt_3",
      title: "Feature Development",
      start: "2026-01-31T14:00:00Z",
      end: "2026-01-31T16:00:00Z",
      predicted_duration: undefined,
    },
    {
      id: "evt_4",
      title: "1:1 with Manager",
      start: "2026-02-01T11:00:00Z",
      end: "2026-02-01T11:30:00Z",
      predicted_duration: 30,
    },
  ]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
  const groupedEvents = events.reduce((acc, event) => {
    const date = formatDate(event.start);
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-gray-500 mb-2">{date}</h3>
          <div className="space-y-2">
            {dateEvents.map((event) => {
              const scheduledMinutes = getScheduledDuration(event.start, event.end);
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {/* Time */}
                  <div className="text-sm text-gray-500 w-20 flex-shrink-0">
                    {formatTime(event.start)}
                  </div>

                  {/* Event details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {scheduledMinutes} min scheduled
                      </span>
                      {event.predicted_duration && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor(
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
                  <button className="text-gray-400 hover:text-gray-600">
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

      {events.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No upcoming events</p>
        </div>
      )}

      {/* Add Event Button */}
      <button className="w-full btn btn-secondary text-sm">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Event
      </button>
    </div>
  );
}
