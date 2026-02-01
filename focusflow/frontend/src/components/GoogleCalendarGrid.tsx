"use client";

import { useState, useMemo } from "react";
import type { CalendarEvent } from "@/lib/types";

interface GoogleCalendarGridProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onAddEvent?: (date: Date) => void;
}

export default function GoogleCalendarGrid({
  events,
  selectedDate,
  onDateSelect,
  onAddEvent,
}: GoogleCalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get calendar grid days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));

    const days: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentMonth]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-gray-900 min-w-[160px] text-center">
            {formatMonthYear(currentMonth)}
          </h3>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1 flex-1">
          {calendarDays.map((date, index) => {
            const dateEvents = getEventsForDate(date);
            const hasEvents = dateEvents.length > 0;

            return (
              <button
                key={index}
                onClick={() => onDateSelect(date)}
                onDoubleClick={() => onAddEvent?.(date)}
                className={`
                  relative p-1 min-h-[60px] rounded-lg text-sm transition-all
                  flex flex-col items-center
                  ${!isCurrentMonth(date) ? "text-gray-300" : "text-gray-900"}
                  ${isToday(date) ? "ring-2 ring-primary-500" : ""}
                  ${isSelected(date) ? "bg-primary-100" : "hover:bg-gray-50"}
                `}
              >
                <span
                  className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-sm
                    ${isToday(date) && !isSelected(date) ? "bg-primary-500 text-white" : ""}
                    ${isSelected(date) ? "bg-primary-600 text-white" : ""}
                  `}
                >
                  {date.getDate()}
                </span>

                {/* Event indicators */}
                {hasEvents && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full">
                    {dateEvents.slice(0, 3).map((event, i) => (
                      <div
                        key={event.id}
                        className="w-1.5 h-1.5 rounded-full bg-primary-500"
                        title={event.title}
                      />
                    ))}
                    {dateEvents.length > 3 && (
                      <span className="text-[10px] text-gray-500">
                        +{dateEvents.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick add hint */}
      <div className="mt-2 text-xs text-gray-400 text-center">
        Double-click a date to add an event
      </div>
    </div>
  );
}
