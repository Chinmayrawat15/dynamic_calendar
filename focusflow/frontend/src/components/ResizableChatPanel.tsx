"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ChatBot from "./ChatBot";

interface ResizableChatPanelProps {
  currentTask?: string;
  conservativity: number;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}

export default function ResizableChatPanel({
  currentTask,
  conservativity,
  minWidth = 320,
  maxWidth = 800,
  defaultWidth = 400,
}: ResizableChatPanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const panelRect = panelRef.current.getBoundingClientRect();
      const newWidth = panelRect.right - e.clientX;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    },
    [isResizing, minWidth, maxWidth]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <div
      ref={panelRef}
      className="h-full bg-white/90 backdrop-blur-xl border-l border-surface-200/50 flex flex-col relative shadow-soft-lg"
      style={{ width: `${width}px`, minWidth: `${minWidth}px` }}
    >
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize group z-10"
        onMouseDown={startResizing}
      >
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-200 ${
            isResizing ? "bg-primary-500 shadow-glow" : "bg-transparent group-hover:bg-primary-300"
          }`}
        />
        {/* Drag indicator dots */}
        <div className="absolute left-[-2px] top-1/2 transform -translate-y-1/2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-1 h-1 rounded-full bg-surface-400" />
          <div className="w-1 h-1 rounded-full bg-surface-400" />
          <div className="w-1 h-1 rounded-full bg-surface-400" />
        </div>
      </div>

      {/* Header */}
      <div className="p-5 border-b border-surface-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-surface-900">Timekeeper</h2>
            <p className="text-xs text-surface-500">Powered by Keywords.ai</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-surface-400 bg-surface-50 px-2.5 py-1.5 rounded-lg">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
          <span className="hidden sm:inline">Resize</span>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 p-4 overflow-hidden">
        <ChatBot currentTask={currentTask} conservativity={conservativity} />
      </div>
    </div>
  );
}
