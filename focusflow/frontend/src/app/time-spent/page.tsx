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
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Time Spent</h1>
            <p className="text-gray-500">
              Track how you spend your time across different websites
            </p>
          </div>

          {/* Time Spent Component */}
          <div className="card">
            <TimeSpent />
          </div>
        </div>
      </main>
    </div>
  );
}
