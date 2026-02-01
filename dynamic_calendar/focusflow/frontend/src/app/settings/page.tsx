"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ConservativitySlider from "@/components/ConservativitySlider";
import { getSettings, updateSettings } from "@/lib/api";
import type { SettingsResponse } from "@/lib/types";

/**
 * Settings Page with real API integration
 */
export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [newSite, setNewSite] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings on mount
  const fetchSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      // Use default settings on error
      setSettings({
        conservativity: 0.5,
        tracked_sites: ["github.com", "stackoverflow.com", "docs.google.com"],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle save with API call
  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      await updateSettings({
        conservativity: settings.conservativity,
        tracked_sites: settings.tracked_sites,
      });
      setSaveStatus("success");
      setHasChanges(false);
      // Reset success message after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConservativityChange = (value: number) => {
    if (!settings) return;
    setSettings({ ...settings, conservativity: value });
    setHasChanges(true);
  };

  const handleAddSite = () => {
    if (!settings || !newSite.trim()) return;

    // Clean up the site URL
    let site = newSite.trim().toLowerCase();
    site = site.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    const sites = settings.tracked_sites || [];
    if (!sites.includes(site)) {
      setSettings({
        ...settings,
        tracked_sites: [...sites, site],
      });
      setHasChanges(true);
    }
    setNewSite("");
  };

  const handleRemoveSite = (site: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      tracked_sites: (settings.tracked_sites || []).filter((s) => s !== site),
    });
    setHasChanges(true);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="card mb-6">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-20 bg-gray-100 rounded"></div>
            </div>
            <div className="card">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-flex items-center gap-1 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Configure your FocusFlow preferences</p>
        </div>

        {/* Conservativity Setting */}
        <div className="card mb-6 animate-fadeIn">
          <h2 className="text-lg font-semibold mb-4">Prediction Conservativity</h2>
          <p className="text-sm text-gray-500 mb-4">
            Adjust how conservative your task duration predictions should be.
            Higher values account for interruptions and bad days.
          </p>
          <ConservativitySlider
            value={settings.conservativity}
            onChange={handleConservativityChange}
          />
        </div>

        {/* Tracked Sites */}
        <div className="card mb-6 animate-fadeIn" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-lg font-semibold mb-4">Tracked Sites</h2>
          <p className="text-sm text-gray-500 mb-4">
            Sites to include in productivity tracking. Activity on other sites
            won't be tracked.
          </p>

          {/* Add new site */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              placeholder="example.com"
              className="input flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAddSite()}
            />
            <button
              onClick={handleAddSite}
              disabled={!newSite.trim()}
              className="btn btn-secondary disabled:opacity-50"
            >
              Add
            </button>
          </div>

          {/* Site list */}
          <div className="space-y-2">
            {(settings.tracked_sites || []).map((site, index) => (
              <div
                key={site}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors animate-fadeIn"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span className="text-sm text-gray-700">{site}</span>
                </div>
                <button
                  onClick={() => handleRemoveSite(site)}
                  className="text-red-500 hover:text-red-700 text-sm hover:bg-red-50 px-2 py-1 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
            {(settings.tracked_sites || []).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No sites configured. Add sites above.
              </p>
            )}
          </div>
        </div>

        {/* Data Management */}
        <div className="card mb-6 animate-fadeIn" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-lg font-semibold mb-4">Data Management</h2>
          <div className="space-y-3">
            <button className="btn btn-secondary w-full group">
              <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export My Data
            </button>
            <button className="btn bg-red-50 text-red-700 hover:bg-red-100 w-full group">
              <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All Data
            </button>
          </div>
        </div>

        {/* Save Section */}
        <div className="flex items-center justify-between animate-fadeIn" style={{ animationDelay: "0.3s" }}>
          {/* Status messages */}
          <div className="flex items-center gap-2">
            {saveStatus === "success" && (
              <div className="flex items-center gap-2 text-green-600 animate-fadeIn">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Settings saved!</span>
              </div>
            )}
            {saveStatus === "error" && (
              <div className="flex items-center gap-2 text-red-600 animate-fadeIn">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-sm">Failed to save. Try again.</span>
              </div>
            )}
            {hasChanges && saveStatus === "idle" && (
              <span className="text-sm text-yellow-600 animate-fadeIn">Unsaved changes</span>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="btn btn-primary disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
