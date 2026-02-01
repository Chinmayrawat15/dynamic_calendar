"use client";

import type { StatsResponse } from "@/lib/types";

interface StatsCardsProps {
  stats: StatsResponse;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const getFocusColor = (score: number) => {
    if (score >= 70) return { text: "text-success-600", bg: "bg-success-50", icon: "text-success-500", border: "border-success-200" };
    if (score >= 40) return { text: "text-warning-600", bg: "bg-warning-50", icon: "text-warning-500", border: "border-warning-200" };
    return { text: "text-danger-600", bg: "bg-danger-50", icon: "text-danger-500", border: "border-danger-200" };
  };

  const focusColors = getFocusColor(stats.today_focus_score);

  const cards = [
    {
      title: "Focus Score",
      value: Math.round(stats.today_focus_score),
      suffix: "/100",
      colors: focusColors,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      trend: stats.today_focus_score >= 70 ? "up" : stats.today_focus_score >= 40 ? "neutral" : "down",
    },
    {
      title: "Hours Tracked",
      value: stats.hours_tracked_today.toFixed(1),
      suffix: "h",
      colors: { text: "text-primary-600", bg: "bg-primary-50", icon: "text-primary-500", border: "border-primary-200" },
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      trend: "neutral",
    },
    {
      title: "Prediction Accuracy",
      value: Math.round(stats.prediction_accuracy_percent),
      suffix: "%",
      colors: { text: "text-violet-600", bg: "bg-violet-50", icon: "text-violet-500", border: "border-violet-200" },
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      trend: stats.prediction_accuracy_percent >= 80 ? "up" : "neutral",
    },
    {
      title: "Total Sessions",
      value: stats.total_sessions,
      suffix: "",
      colors: { text: "text-surface-700", bg: "bg-surface-100", icon: "text-surface-500", border: "border-surface-200" },
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      trend: "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className={`card-hover group ${card.colors.border} border`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className={`stat-icon ${card.colors.bg} group-hover:scale-110 transition-transform duration-300`}>
              <span className={card.colors.icon}>{card.icon}</span>
            </div>
            {card.trend === "up" && (
              <span className="badge badge-success">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Good
              </span>
            )}
            {card.trend === "down" && (
              <span className="badge badge-error">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Low
              </span>
            )}
          </div>
          <div className="mt-4">
            <p className="stat-label">{card.title}</p>
            <p className={`stat-value ${card.colors.text}`}>
              {card.value}
              <span className="text-lg font-medium text-surface-400 ml-0.5">{card.suffix}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
