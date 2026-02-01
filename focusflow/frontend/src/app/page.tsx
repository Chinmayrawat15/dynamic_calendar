"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import StatsCards from "@/components/StatsCards";
import ChatBot from "@/components/ChatBot";
import Calendar from "@/components/Calendar";
import ConservativitySlider from "@/components/ConservativitySlider";
import type { StatsResponse } from "@/lib/types";

/**
 * Main Dashboard Page
 * TODO: Person C - Wire up real API calls and add loading states
 */
export default function Dashboard() {
  // TODO: Person C - Fetch from API
  const [stats, setStats] = useState<StatsResponse>({
    today_focus_score: 73,
    hours_tracked_today: 4.5,
    prediction_accuracy_percent: 82,
    total_sessions: 47,
  });

  const [conservativity, setConservativity] = useState(0.5);
  const [currentTask, setCurrentTask] = useState<string | undefined>(undefined);

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

  // TODO: Person C - Fetch real stats on mount
  // useEffect(() => {
  //   const fetchStats = async () => {
  //     try {
  //       const data = await getStats();
  //       setStats(data);
  //     } catch (error) {
  //       console.error("Failed to fetch stats:", error);
  //     }
  //   };
  //   fetchStats();
  //   const interval = setInterval(fetchStats, 30000);
  //   return () => clearInterval(interval);
  // }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar currentTask={currentTask} onTaskChange={setCurrentTask} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">
              Track your productivity and get AI-powered predictions
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mb-6">
            <StatsCards stats={stats} />
          </div>

          {/* Conservativity Slider */}
          <div className="mb-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Prediction Settings</h2>
              <ConservativitySlider
                value={conservativity}
                onChange={setConservativity}
              />
            </div>
          </div>

          {/* Calendar - now full width */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
            <Calendar />
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
          className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary-500 transition-colors z-10 ${
            isResizing ? "bg-primary-500" : "bg-transparent hover:bg-primary-300"
          }`}
          title="Drag to resize"
        >
          {/* Visual indicator for the drag handle */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 flex flex-col items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
            <div className="w-0.5 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-0.5 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-0.5 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex flex-col flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">FocusFlow Assistant</h2>
            <span className="text-xs text-gray-400">Drag left edge to resize</span>
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
