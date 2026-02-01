"use client";

import type { StatsResponse } from "@/lib/types";

interface StatsCardsProps {
  stats: StatsResponse;
}

/**
 * Dashboard stats cards with animations
 */
export default function StatsCards({ stats }: StatsCardsProps) {
  // Determine focus score color
  const getFocusColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getFocusBg = (score: number) => {
    if (score >= 70) return "bg-green-100";
    if (score >= 40) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getFocusRing = (score: number) => {
    if (score >= 70) return "ring-green-200";
    if (score >= 40) return "ring-yellow-200";
    return "ring-red-200";
  };

  const cards = [
    {
      title: "Focus Score",
      value: Math.round(stats.today_focus_score),
      suffix: "/100",
      color: getFocusColor(stats.today_focus_score),
      bg: getFocusBg(stats.today_focus_score),
      ring: getFocusRing(stats.today_focus_score),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: stats.today_focus_score >= 70 ? "Great focus!" : stats.today_focus_score >= 40 ? "Room to improve" : "Stay focused",
    },
    {
      title: "Hours Tracked",
      value: stats.hours_tracked_today.toFixed(1),
      suffix: "h",
      color: "text-primary-600",
      bg: "bg-primary-100",
      ring: "ring-primary-200",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: "Today's total",
    },
    {
      title: "Prediction Accuracy",
      value: Math.round(stats.prediction_accuracy_percent),
      suffix: "%",
      color: "text-purple-600",
      bg: "bg-purple-100",
      ring: "ring-purple-200",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: "Last 7 days",
    },
    {
      title: "Total Sessions",
      value: stats.total_sessions,
      suffix: "",
      color: "text-gray-600",
      bg: "bg-gray-100",
      ring: "ring-gray-200",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      description: "All time",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className="card group hover:scale-[1.02] cursor-default"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
              <p className={`text-3xl font-bold ${card.color} animate-countUp`}>
                {card.value}
                <span className="text-lg font-medium opacity-70">{card.suffix}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">{card.description}</p>
            </div>
            <div className={`p-3 rounded-xl ${card.bg} ring-4 ${card.ring} ring-opacity-50 group-hover:scale-110 transition-transform`}>
              <div className={card.color}>{card.icon}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
