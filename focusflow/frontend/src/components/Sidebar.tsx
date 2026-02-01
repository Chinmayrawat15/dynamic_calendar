"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  currentTask?: string;
  onTaskChange: (task: string | undefined) => void;
}

/**
 * Sidebar component with navigation and current task input.
 * TODO: Person C - Add more navigation items and polish styling
 */
export default function Sidebar({ currentTask, onTaskChange }: SidebarProps) {
  const [taskInput, setTaskInput] = useState(currentTask || "");
  const [isTracking, setIsTracking] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const handleStartTracking = () => {
    if (taskInput.trim()) {
      onTaskChange(taskInput.trim());
      setIsTracking(true);
    }
  };

  const handleStopTracking = () => {
    onTaskChange(undefined);
    setIsTracking(false);
    setTaskInput("");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">FocusFlow</h1>
        <p className="text-xs text-gray-500">Productivity Tracking</p>
      </div>

      {/* Current Task */}
      <div className="p-4 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Task
        </label>
        {isTracking ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-900 truncate">
                {currentTask}
              </span>
            </div>
            <button
              onClick={handleStopTracking}
              className="btn btn-secondary w-full text-sm"
            >
              Stop Tracking
            </button>
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="What are you working on?"
              className="input mb-2"
              onKeyDown={(e) => e.key === "Enter" && handleStartTracking()}
            />
            <button
              onClick={handleStartTracking}
              disabled={!taskInput.trim()}
              className="btn btn-primary w-full text-sm disabled:opacity-50"
            >
              Start Tracking
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
                isActive("/")
                  ? "text-gray-900 bg-primary-50"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/time-spent"
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
                isActive("/time-spent")
                  ? "text-gray-900 bg-primary-50"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Time Spent
            </Link>
          </li>
          <li>
            <Link
              href="/settings"
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
                isActive("/settings")
                  ? "text-gray-900 bg-primary-50"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          FocusFlow v1.0.0
        </p>
      </div>
    </aside>
  );
}
