"use client";

import { useState, useEffect } from "react";

interface WebsiteUsage {
  domain: string;
  timeMs: number;
  category: "productive" | "neutral" | "distracting";
  favicon?: string;
}

/**
 * TimeSpent component showing time spent on different websites.
 * TODO: Wire up to real API when backend activity tracking is complete
 */
export default function TimeSpent() {
  // TODO: Fetch from /api/activity/summary when ready
  const [usageData, setUsageData] = useState<WebsiteUsage[]>([
    { domain: "github.com", timeMs: 7200000, category: "productive" },
    { domain: "stackoverflow.com", timeMs: 3600000, category: "productive" },
    { domain: "docs.google.com", timeMs: 2700000, category: "productive" },
    { domain: "youtube.com", timeMs: 1800000, category: "distracting" },
    { domain: "twitter.com", timeMs: 900000, category: "distracting" },
    { domain: "slack.com", timeMs: 2400000, category: "neutral" },
    { domain: "notion.so", timeMs: 1500000, category: "productive" },
    { domain: "reddit.com", timeMs: 600000, category: "distracting" },
  ]);

  const [selectedTab, setSelectedTab] = useState<"all" | "productive" | "distracting">("all");

  // Format milliseconds to readable time
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get total time
  const totalTime = usageData.reduce((acc, item) => acc + item.timeMs, 0);

  // Get productive time
  const productiveTime = usageData
    .filter((item) => item.category === "productive")
    .reduce((acc, item) => acc + item.timeMs, 0);

  // Get distracting time
  const distractingTime = usageData
    .filter((item) => item.category === "distracting")
    .reduce((acc, item) => acc + item.timeMs, 0);

  // Filter data based on selected tab
  const filteredData =
    selectedTab === "all"
      ? usageData
      : usageData.filter((item) => item.category === selectedTab);

  // Sort by time spent (descending)
  const sortedData = [...filteredData].sort((a, b) => b.timeMs - a.timeMs);

  // Get category color
  const getCategoryColor = (category: WebsiteUsage["category"]) => {
    switch (category) {
      case "productive":
        return "bg-green-100 text-green-700";
      case "distracting":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Get progress bar color
  const getBarColor = (category: WebsiteUsage["category"]) => {
    switch (category) {
      case "productive":
        return "bg-green-500";
      case "distracting":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Total Time</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatTime(totalTime)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-green-600 mb-1">Productive</p>
          <p className="text-lg font-semibold text-green-700">
            {formatTime(productiveTime)}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-xs text-red-600 mb-1">Distracting</p>
          <p className="text-lg font-semibold text-red-700">
            {formatTime(distractingTime)}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "productive", "distracting"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${
              selectedTab === tab
                ? "bg-primary-100 text-primary-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Website List */}
      <div className="space-y-2 max-h-[280px] overflow-auto">
        {sortedData.map((item) => (
          <div
            key={item.domain}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {/* Favicon placeholder */}
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-gray-500 uppercase">
                {item.domain.charAt(0)}
              </span>
            </div>

            {/* Domain and bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {item.domain}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  {formatTime(item.timeMs)}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getBarColor(
                    item.category
                  )}`}
                  style={{ width: `${(item.timeMs / totalTime) * 100}%` }}
                />
              </div>
            </div>

            {/* Category badge */}
            <span
              className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${getCategoryColor(
                item.category
              )}`}
            >
              {item.category}
            </span>
          </div>
        ))}
      </div>

      {sortedData.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p>No activity data yet</p>
        </div>
      )}
    </div>
  );
}
