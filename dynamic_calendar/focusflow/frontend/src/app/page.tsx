"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import StatsCards from "@/components/StatsCards";
import ChatBot from "@/components/ChatBot";
import Calendar from "@/components/Calendar";
import GoogleCalendarView from "@/components/GoogleCalendarView";
import ConservativitySlider from "@/components/ConservativitySlider";
import AccountMenu from "@/components/AccountMenu";
import { useUser } from "@/contexts/UserContext";
import { getStats, getSettings, updateSettings } from "@/lib/api";
import type { StatsResponse } from "@/lib/types";

/**
 * Main Dashboard Page
 * Real API integration with polling and error handling
 */
export default function Dashboard() {
  const { user, isAuthenticated } = useUser();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [conservativity, setConservativity] = useState(0.5);
  const [currentTask, setCurrentTask] = useState<string | undefined>(undefined);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Chat panel resize state
  const [chatPanelWidth, setChatPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  const MIN_CHAT_WIDTH = 300;
  const MAX_CHAT_WIDTH = 800;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= MIN_CHAT_WIDTH && newWidth <= MAX_CHAT_WIDTH) {
        setChatPanelWidth(newWidth);
      }
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Fetch stats with error handling
  const fetchStats = useCallback(async () => {
    try {
      const data = await getStats();
      setStats(data);
      setStatsError(null);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setStatsError("Unable to load stats");
      // Use fallback data on error
      if (!stats) {
        setStats({
          today_focus_score: 0,
          hours_tracked_today: 0,
          prediction_accuracy_percent: 0,
          total_sessions: 0,
        });
      }
    } finally {
      setStatsLoading(false);
    }
  }, [stats]);

  // Fetch settings on mount
  const fetchSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setConservativity(data.conservativity);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Handle conservativity change with auto-save
  const handleConservativityChange = async (value: number) => {
    setConservativity(value);
    try {
      await updateSettings({ conservativity: value });
    } catch (error) {
      console.error("Failed to save conservativity:", error);
    }
  };

  // Fetch stats on mount and poll every 30 seconds
  useEffect(() => {
    fetchStats();
    fetchSettings();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchSettings]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar currentTask={currentTask} onTaskChange={setCurrentTask} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isAuthenticated && user?.given_name
                  ? `Hey there, ${user.given_name}!`
                  : "Dashboard"}
              </h1>
              <p className="text-gray-500">
                Track your productivity and get AI-powered predictions
              </p>
            </div>
            <AccountMenu />
          </div>

          {/* Stats Cards */}
          <div className="mb-6">
            {statsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : statsError ? (
              <div className="card bg-red-50 border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{statsError}</span>
                  </div>
                  <button
                    onClick={fetchStats}
                    className="btn btn-secondary text-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : stats ? (
              <StatsCards stats={stats} />
            ) : null}
          </div>

          {/* Conservativity Slider */}
          <div className="mb-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Prediction Settings</h2>
              {settingsLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <ConservativitySlider
                  value={conservativity}
                  onChange={handleConservativityChange}
                />
              )}
            </div>
          </div>

          {/* Calendar Section - Two equal boxes side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Google Calendar View - Left Box */}
            <div className="card min-h-[500px] flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Google Calendar</h2>
              <div className="flex-1">
                <GoogleCalendarView />
              </div>
            </div>

            {/* Upcoming Events - Right Box */}
            <div className="card min-h-[500px] flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
              <div className="flex-1 overflow-auto">
                <Calendar />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Resizable Chat Panel - Right Sidebar */}
      <div
        className="relative flex h-screen bg-white border-l border-gray-200 shadow-lg"
        style={{ width: chatPanelWidth }}
      >
        {/* Resize Handle */}
        <div
          ref={resizeRef}
          onMouseDown={handleMouseDown}
          className={`absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize transition-colors z-10 ${
            isResizing ? "bg-primary-500" : "bg-transparent hover:bg-primary-300"
          }`}
          title="Drag to resize"
        />

        {/* Chat Content */}
        <div className="flex flex-col flex-1 p-4 ml-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">FocusFlow Assistant</h2>
            <span className="text-xs text-gray-400">← Drag to resize</span>
          </div>
          <div className="flex-1 min-h-0">
            <ChatBot
              currentTask={currentTask}
              conservativity={conservativity}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
