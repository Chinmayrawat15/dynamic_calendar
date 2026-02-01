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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="icon-btn"
          >
            <svg
              className="w-5 h-5"
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
          <h3 className="text-lg font-semibold text-surface-900 min-w-[160px] text-center">
            {formatMonthYear(currentMonth)}
          </h3>
          <button
            onClick={nextMonth}
            className="icon-btn"
          >
            <svg
              className="w-5 h-5"
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
          className="btn btn-ghost text-sm px-3 py-1.5"
        >
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-surface-400 uppercase tracking-wider py-2"
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
                  relative p-1 min-h-[56px] rounded-xl text-sm transition-all duration-200
                  flex flex-col items-center
                  ${!isCurrentMonth(date) ? "text-surface-300" : "text-surface-700"}
                  ${isToday(date) && !isSelected(date) ? "ring-2 ring-primary-400 ring-offset-1" : ""}
                  ${isSelected(date) ? "bg-primary-100 shadow-sm" : "hover:bg-surface-100"}
                `}
              >
                <span
                  className={`
                    w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium
                    transition-all duration-200
                    ${isToday(date) && !isSelected(date) ? "bg-primary-500 text-white shadow-md shadow-primary-500/30" : ""}
                    ${isSelected(date) ? "bg-primary-600 text-white shadow-md shadow-primary-500/30" : ""}
                  `}
                >
                  {date.getDate()}
                </span>

                {/* Event indicators */}
                {hasEvents && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full">
                    {dateEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-sm"
                        title={event.title}
                      />
                    ))}
                    {dateEvents.length > 3 && (
                      <span className="text-[10px] text-surface-500 font-medium">
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
      <div className="mt-3 pt-3 border-t border-surface-100 flex items-center justify-center gap-2 text-xs text-surface-400">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Double-click a date to add an event
      </div>
    </div>
  );
}
