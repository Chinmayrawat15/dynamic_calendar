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

/**
 * Resizable chat panel that displays the FocusFlow Assistant on the right side.
 * Users can drag the left edge to resize the panel.
 */
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
      className="h-full bg-white border-l border-gray-200 flex flex-col relative"
      style={{ width: `${width}px`, minWidth: `${minWidth}px` }}
    >
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary-400 transition-colors group z-10"
        onMouseDown={startResizing}
      >
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${
            isResizing ? "bg-primary-500" : "bg-transparent group-hover:bg-primary-300"
          } transition-colors`}
        />
        {/* Drag indicator dots */}
        <div className="absolute left-[-3px] top-1/2 transform -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        </div>
      </div>

      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">FocusFlow Assistant</h2>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Drag edge to resize</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 p-4 overflow-hidden">
        <ChatBot currentTask={currentTask} conservativity={conservativity} />
      </div>
    </div>
  );
}
