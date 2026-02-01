"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import StatsCards from "@/components/StatsCards";
import ResizableChatPanel from "@/components/ResizableChatPanel";
import Calendar from "@/components/Calendar";
import ConservativitySlider from "@/components/ConservativitySlider";
import { getStats, getSettings, updateSettings } from "@/lib/api";
import type { StatsResponse } from "@/lib/types";

/**
 * Main Dashboard Page
 * Fetches real stats from the backend and syncs settings.
 */
export default function Dashboard() {
  const [stats, setStats] = useState<StatsResponse>({
    today_focus_score: 0,
    hours_tracked_today: 0,
    prediction_accuracy_percent: 0,
    total_sessions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [conservativity, setConservativity] = useState(0.5);
  const [currentTask, setCurrentTask] = useState<string | undefined>(undefined);

  // Fetch stats on mount and refresh every 30 seconds
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getSettings();
        setConservativity(settings.conservativity);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    fetchSettings();
  }, []);

  // Save conservativity when it changes
  const handleConservativityChange = async (value: number) => {
    setConservativity(value);
    try {
      await updateSettings({ conservativity: value });
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

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
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="card animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <StatsCards stats={stats} />
              )}
            </div>

            {/* Conservativity Slider */}
            <div className="mb-6">
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Prediction Settings</h2>
                <ConservativitySlider
                  value={conservativity}
                  onChange={handleConservativityChange}
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
