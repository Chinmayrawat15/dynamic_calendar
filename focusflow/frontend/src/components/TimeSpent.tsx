"use client";

import { useState } from "react";

interface WebsiteUsage {
  domain: string;
  timeMs: number;
  category: "productive" | "neutral" | "distracting";
  favicon?: string;
}

export default function TimeSpent() {
  const [usageData] = useState<WebsiteUsage[]>([
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

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const totalTime = usageData.reduce((acc, item) => acc + item.timeMs, 0);

  const productiveTime = usageData
    .filter((item) => item.category === "productive")
    .reduce((acc, item) => acc + item.timeMs, 0);

  const distractingTime = usageData
    .filter((item) => item.category === "distracting")
    .reduce((acc, item) => acc + item.timeMs, 0);

  const filteredData =
    selectedTab === "all"
      ? usageData
      : usageData.filter((item) => item.category === selectedTab);

  const sortedData = [...filteredData].sort((a, b) => b.timeMs - a.timeMs);

  const getCategoryBadge = (category: WebsiteUsage["category"]) => {
    switch (category) {
      case "productive":
        return "badge-success";
      case "distracting":
        return "badge-error";
      default:
        return "badge-neutral";
    }
  };

  const getBarColor = (category: WebsiteUsage["category"]) => {
    switch (category) {
      case "productive":
        return "bg-success-500";
      case "distracting":
        return "bg-danger-500";
      default:
        return "bg-surface-400";
    }
  };

  const getIconBg = (category: WebsiteUsage["category"]) => {
    switch (category) {
      case "productive":
        return "bg-success-100 text-success-600";
      case "distracting":
        return "bg-danger-100 text-danger-600";
      default:
        return "bg-surface-100 text-surface-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 stagger-children">
        <div className="bg-surface-50 rounded-xl p-4 text-center border border-surface-100">
          <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-surface-500 font-medium mb-1">Total Time</p>
          <p className="text-xl font-bold text-surface-900">
            {formatTime(totalTime)}
          </p>
        </div>
        <div className="bg-success-50 rounded-xl p-4 text-center border border-success-100">
          <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-success-600 font-medium mb-1">Productive</p>
          <p className="text-xl font-bold text-success-700">
            {formatTime(productiveTime)}
          </p>
        </div>
        <div className="bg-danger-50 rounded-xl p-4 text-center border border-danger-100">
          <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-xs text-danger-600 font-medium mb-1">Distracting</p>
          <p className="text-xl font-bold text-danger-700">
            {formatTime(distractingTime)}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-surface-100 rounded-xl">
        {(["all", "productive", "distracting"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`flex-1 px-4 py-2 text-sm rounded-lg transition-all duration-200 capitalize font-medium ${
              selectedTab === tab
                ? "bg-white text-surface-900 shadow-sm"
                : "text-surface-600 hover:text-surface-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Website List */}
      <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
        {sortedData.map((item, index) => (
          <div
            key={item.domain}
            className="flex items-center gap-4 p-3 bg-surface-50 hover:bg-surface-100 rounded-xl transition-all duration-200 group animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Favicon placeholder */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg(item.category)}`}>
              <span className="text-sm font-bold uppercase">
                {item.domain.charAt(0)}
              </span>
            </div>

            {/* Domain and bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-surface-900 truncate group-hover:text-primary-700 transition-colors">
                  {item.domain}
                </span>
                <span className="text-sm font-semibold text-surface-700 ml-2">
                  {formatTime(item.timeMs)}
                </span>
              </div>
              <div className="progress">
                <div
                  className={`progress-bar ${getBarColor(item.category)}`}
                  style={{ width: `${(item.timeMs / totalTime) * 100}%` }}
                />
              </div>
            </div>

            {/* Category badge */}
            <span className={`badge ${getCategoryBadge(item.category)} flex-shrink-0`}>
              {item.category}
            </span>
          </div>
        ))}
      </div>

      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-surface-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-surface-600 font-medium">No activity data yet</p>
          <p className="text-surface-400 text-sm mt-1">Start browsing to see your stats</p>
        </div>
      )}
    </div>
  );
}
