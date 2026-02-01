"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

// Dummy data for website time tracking
// In the future, this will be pulled from the Chrome extension
const dummyWebsiteData = [
  {
    id: 1,
    domain: "github.com",
    favicon: "https://github.com/favicon.ico",
    timeSpent: 7200, // seconds
    category: "Development",
    visits: 45,
  },
  {
    id: 2,
    domain: "stackoverflow.com",
    favicon: "https://stackoverflow.com/favicon.ico",
    timeSpent: 3600,
    category: "Development",
    visits: 23,
  },
  {
    id: 3,
    domain: "youtube.com",
    favicon: "https://youtube.com/favicon.ico",
    timeSpent: 5400,
    category: "Entertainment",
    visits: 12,
  },
  {
    id: 4,
    domain: "docs.google.com",
    favicon: "https://docs.google.com/favicon.ico",
    timeSpent: 2700,
    category: "Productivity",
    visits: 8,
  },
  {
    id: 5,
    domain: "twitter.com",
    favicon: "https://twitter.com/favicon.ico",
    timeSpent: 1800,
    category: "Social Media",
    visits: 15,
  },
  {
    id: 6,
    domain: "linkedin.com",
    favicon: "https://linkedin.com/favicon.ico",
    timeSpent: 900,
    category: "Social Media",
    visits: 5,
  },
  {
    id: 7,
    domain: "notion.so",
    favicon: "https://notion.so/favicon.ico",
    timeSpent: 4500,
    category: "Productivity",
    visits: 18,
  },
  {
    id: 8,
    domain: "reddit.com",
    favicon: "https://reddit.com/favicon.ico",
    timeSpent: 2400,
    category: "Entertainment",
    visits: 10,
  },
];

// Category colors
const categoryColors: Record<string, { bg: string; text: string }> = {
  Development: { bg: "bg-blue-100", text: "text-blue-700" },
  Productivity: { bg: "bg-green-100", text: "text-green-700" },
  Entertainment: { bg: "bg-purple-100", text: "text-purple-700" },
  "Social Media": { bg: "bg-orange-100", text: "text-orange-700" },
};

// Format seconds to readable time
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Calculate total time
function getTotalTime(data: typeof dummyWebsiteData): number {
  return data.reduce((acc, site) => acc + site.timeSpent, 0);
}

// Get time by category
function getTimeByCategory(data: typeof dummyWebsiteData): Record<string, number> {
  return data.reduce((acc, site) => {
    acc[site.category] = (acc[site.category] || 0) + site.timeSpent;
    return acc;
  }, {} as Record<string, number>);
}

export default function TimeSpentPage() {
  const [currentTask, setCurrentTask] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"time" | "visits">("time");

  const sortedData = [...dummyWebsiteData].sort((a, b) => {
    if (sortBy === "time") return b.timeSpent - a.timeSpent;
    return b.visits - a.visits;
  });

  const totalTime = getTotalTime(dummyWebsiteData);
  const timeByCategory = getTimeByCategory(dummyWebsiteData);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentTask={currentTask} onTaskChange={setCurrentTask} />

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Time Spent</h1>
            <p className="text-gray-500">
              Track how you spend your time across different websites
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Time Card */}
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total Time</p>
                  <p className="text-xl font-bold text-gray-900">{formatTime(totalTime)}</p>
                </div>
              </div>
            </div>

            {/* Sites Visited Card */}
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Sites Visited</p>
                  <p className="text-xl font-bold text-gray-900">{dummyWebsiteData.length}</p>
                </div>
              </div>
            </div>

            {/* Total Visits Card */}
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total Visits</p>
                  <p className="text-xl font-bold text-gray-900">
                    {dummyWebsiteData.reduce((acc, site) => acc + site.visits, 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Most Used Category */}
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Top Category</p>
                  <p className="text-xl font-bold text-gray-900">
                    {Object.entries(timeByCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Time by Category</h2>
            <div className="space-y-3">
              {Object.entries(timeByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([category, time]) => {
                  const percentage = Math.round((time / totalTime) * 100);
                  const colors = categoryColors[category] || { bg: "bg-gray-100", text: "text-gray-700" };
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                          {category}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatTime(time)} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${colors.bg.replace("100", "500")}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Website List */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Website Breakdown</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "time" | "visits")}
                  className="input text-sm py-1 px-2"
                >
                  <option value="time">Time Spent</option>
                  <option value="visits">Visits</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {sortedData.map((site) => {
                const percentage = Math.round((site.timeSpent / totalTime) * 100);
                const colors = categoryColors[site.category] || { bg: "bg-gray-100", text: "text-gray-700" };
                return (
                  <div
                    key={site.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Favicon placeholder */}
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gray-500">
                        {site.domain.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Site info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {site.domain}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                          {site.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-500">
                          {site.visits} visits
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[200px]">
                          <div
                            className="h-1.5 rounded-full bg-primary-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Time spent */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatTime(site.timeSpent)}
                      </p>
                      <p className="text-xs text-gray-500">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chrome Extension Notice */}
          <div className="mt-6 card bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">Chrome Extension Integration</p>
                <p className="text-sm text-blue-700 mt-1">
                  This page currently shows dummy data. Connect the FocusFlow Chrome extension to track your real browsing activity automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
