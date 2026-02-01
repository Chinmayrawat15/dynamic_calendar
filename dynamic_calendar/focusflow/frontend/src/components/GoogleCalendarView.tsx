"use client";

import { useState, useEffect, useCallback } from "react";
import { getCalendarEvents, getGoogleAuthStatus, initiateGoogleAuth } from "@/lib/api";
import type { CalendarEvent } from "@/lib/types";

interface GoogleCalendarViewProps {
  onEventClick?: (event: CalendarEvent) => void;
}

/**
 * Google Calendar View component - displays a monthly calendar grid with events
 */
export default function GoogleCalendarView({ onEventClick }: GoogleCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      const status = await getGoogleAuthStatus();
      setIsAuthenticated(status.authenticated);
    } catch (error) {
      console.error("Failed to check auth status:", error);
      setIsAuthenticated(false);
    }
  }, []);

  // Fetch events for the current month
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split("T")[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

      const response = await getCalendarEvents(startDate, endDate);
      setEvents(response?.events || []);
    } catch (error) {
      console.error("Failed to fetch calendar events:", error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  // Check auth and fetch events on mount and when month changes
  useEffect(() => {
    checkAuthStatus();
    fetchEvents();
  }, [checkAuthStatus, fetchEvents]);

  // Get events for a specific day
  const getEventsForDay = (day: Date | null) => {
    if (!day) return [];
    return events.filter((event) => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === day.getFullYear() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getDate() === day.getDate()
      );
    });
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle Google auth
  const handleConnectGoogle = async () => {
    setIsAuthenticating(true);
    try {
      const authData = await initiateGoogleAuth();
      if (authData.auth_url) {
        // Open auth URL in a popup
        const popup = window.open(
          authData.auth_url,
          "google-auth",
          "width=500,height=600,scrollbars=yes"
        );

        // Listen for auth completion
        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            setIsAuthenticating(false);
            checkAuthStatus();
            fetchEvents();
          }
        }, 500);
      }
    } catch (error) {
      console.error("Failed to initiate auth:", error);
      setIsAuthenticating(false);
    }
  };

  // Check if a day is today
  const isToday = (day: Date | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day.getFullYear() === today.getFullYear() &&
      day.getMonth() === today.getMonth() &&
      day.getDate() === today.getDate()
    );
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Show connect button if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Google Calendar</h3>
        <p className="text-gray-500 text-center mb-6 max-w-sm">
          Connect your Google Calendar to view and manage your events directly from FocusFlow.
        </p>
        <button
          onClick={handleConnectGoogle}
          disabled={isAuthenticating}
          className="btn btn-primary flex items-center gap-2"
        >
          {isAuthenticating ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Connect Google Calendar
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-gray-900 min-w-[160px] text-center">
            {monthYear}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          onClick={goToToday}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Today
        </button>
      </div>

      {/* Loading State */}
      {isLoading && isAuthenticated === null && (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      )}

      {/* Calendar Grid */}
      {!isLoading && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {days.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              const today = isToday(day);

              return (
                <div
                  key={index}
                  className={`min-h-[60px] p-1 rounded-lg border transition-colors ${
                    day
                      ? today
                        ? "bg-primary-50 border-primary-200"
                        : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      : "bg-gray-50 border-transparent"
                  }`}
                >
                  {day && (
                    <>
                      <div
                        className={`text-sm font-medium mb-1 ${
                          today ? "text-primary-600" : "text-gray-700"
                        }`}
                      >
                        {day.getDate()}
                      </div>
                      <div className="space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            onClick={() => onEventClick?.(event)}
                            className="text-xs truncate px-1 py-0.5 bg-primary-100 text-primary-700 rounded cursor-pointer hover:bg-primary-200 transition-colors"
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 px-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Connection status indicator */}
      {isAuthenticated && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Connected to Google Calendar
          </div>
          <button
            onClick={fetchEvents}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
