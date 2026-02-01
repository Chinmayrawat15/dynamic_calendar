"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import StatsCards from "@/components/StatsCards";
import ResizableChatPanel from "@/components/ResizableChatPanel";
import Calendar from "@/components/Calendar";
import ConservativitySlider from "@/components/ConservativitySlider";
import { getStats, getSettings, updateSettings } from "@/lib/api";
import type { StatsResponse } from "@/lib/types";

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
        <main className="flex-1 overflow-auto p-8 min-w-0">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm-10 9a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5zm10-2a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
                  <p className="text-surface-500 text-sm">
                    Track your productivity and get AI-powered predictions
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-8">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="card">
                      <div className="flex items-start justify-between">
                        <div className="skeleton w-12 h-12 rounded-xl"></div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="skeleton h-4 w-20"></div>
                        <div className="skeleton h-8 w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <StatsCards stats={stats} />
              )}
            </div>

            {/* Conservativity Slider */}
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <div className="card">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="section-title">Prediction Settings</h2>
                    <p className="section-description">Fine-tune your time estimates</p>
                  </div>
                </div>
                <ConservativitySlider
                  value={conservativity}
                  onChange={handleConservativityChange}
                />
              </div>
            </div>

            {/* Google Calendar Integration */}
            <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <div className="card">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="section-title">Google Calendar</h2>
                    <p className="section-description">Your events and AI predictions</p>
                  </div>
                </div>
                <Calendar />
              </div>
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
