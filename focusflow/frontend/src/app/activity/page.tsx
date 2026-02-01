"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import type { ActivityItem } from "@/lib/types";

/**
 * Activity Page
 */
export default function Activity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // TODO: Fetch real activities on mount
  useEffect(() => {
    // Mock data for now
    setActivities([
      {
        id: "1",
        task: "Wrote a new blog post",
        timestamp: "2024-01-31T10:00:00Z",
        duration: 3600,
      },
      {
        id: "2",
        task: "Worked on the new feature",
        timestamp: "2024-01-31T11:00:00Z",
        duration: 1800,
      },
      {
        id: "3",
        task: "Fixed a bug",
        timestamp: "2024-01-31T12:00:00Z",
        duration: 900,
      },
    ]);
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar currentTask={undefined} onTaskChange={() => {}} />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
            <p className="text-gray-500">
              A log of your tracked activities
            </p>
          </div>
          <div className="card">
            <ul>
              {activities.map((activity) => (
                <li key={activity.id} className="border-b last:border-b-0">
                  <div className="p-4">
                    <p className="font-semibold">{activity.task}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()} -{" "}
                      {Math.floor(activity.duration / 60)} minutes
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}