"use client";

import type { StatsResponse } from "@/lib/types";

interface StatsCardsProps {
  stats: StatsResponse;
}

/**
 * Dashboard stats cards component.
 * TODO: Person C - Add animations and real-time updates
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

  const cards = [
    {
      title: "Focus Score",
      value: Math.round(stats.today_focus_score),
      suffix: "/100",
      color: getFocusColor(stats.today_focus_score),
      bg: getFocusBg(stats.today_focus_score),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Hours Tracked",
      value: stats.hours_tracked_today.toFixed(1),
      suffix: "h",
      color: "text-primary-600",
      bg: "bg-primary-100",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Prediction Accuracy",
      value: Math.round(stats.prediction_accuracy_percent),
      suffix: "%",
      color: "text-purple-600",
      bg: "bg-purple-100",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: "Total Sessions",
      value: stats.total_sessions,
      suffix: "",
      color: "text-gray-600",
      bg: "bg-gray-100",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="card">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${card.bg}`}>
              <div className={card.color}>{card.icon}</div>
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className={`text-2xl font-bold ${card.color}`}>
                {card.value}
                <span className="text-sm font-normal">{card.suffix}</span>
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
