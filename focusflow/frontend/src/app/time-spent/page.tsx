"use client";

import Sidebar from "@/components/Sidebar";
import TimeSpent from "@/components/TimeSpent";
import { useState } from "react";

export default function TimeSpentPage() {
  const [currentTask, setCurrentTask] = useState<string | undefined>(undefined);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar currentTask={currentTask} onTaskChange={setCurrentTask} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-surface-900">Time Spent</h1>
                <p className="text-surface-500 text-sm">
                  Track how you spend your time across different websites
                </p>
              </div>
            </div>
          </div>

          {/* Time Spent Component */}
          <div className="card animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="section-title">Activity Breakdown</h2>
                <p className="section-description">Your browsing activity today</p>
              </div>
            </div>
            <TimeSpent />
          </div>
        </div>
      </main>
    </div>
  );
}
