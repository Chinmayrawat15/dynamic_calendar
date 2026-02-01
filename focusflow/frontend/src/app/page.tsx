"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import StatsCards from "@/components/StatsCards";
import ResizableChatPanel from "@/components/ResizableChatPanel";
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
      {/* Left Section: Sidebar + Main Content */}
      <div className="flex flex-1 min-w-0">
        {/* Sidebar */}
        <Sidebar currentTask={currentTask} onTaskChange={setCurrentTask} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 min-w-0">
          <div className="max-w-5xl mx-auto">
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

            {/* Google Calendar Integration */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Google Calendar</h2>
              <Calendar />
            </div>
          </div>
        </main>
      </div>

      {/* Right Section: Resizable Chat Panel */}
      <ResizableChatPanel
        currentTask={currentTask}
        conservativity={conservativity}
        minWidth={320}
        maxWidth={800}
        defaultWidth={400}
      />
    </div>
  );
}
