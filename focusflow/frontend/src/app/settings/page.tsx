"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ConservativitySlider from "@/components/ConservativitySlider";
import type { SettingsResponse } from "@/lib/types";

/**
 * Settings Page
 * TODO: Person C - Wire up real API calls
 */
export default function SettingsPage() {
  // TODO: Person C - Fetch from /api/settings
  const [settings, setSettings] = useState<SettingsResponse>({
    conservativity: 0.5,
    tracked_sites: ["github.com", "stackoverflow.com", "docs.google.com"],
  });

  const [newSite, setNewSite] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // TODO: Person C - Implement save handler
  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Call updateSettings(settings)
    await new Promise((resolve) => setTimeout(resolve, 500)); // Mock delay
    setIsSaving(false);
  };

  const handleAddSite = () => {
    if (newSite && !settings.tracked_sites.includes(newSite)) {
      setSettings({
        ...settings,
        tracked_sites: [...settings.tracked_sites, newSite],
      });
      setNewSite("");
    }
  };

  const handleRemoveSite = (site: string) => {
    setSettings({
      ...settings,
      tracked_sites: settings.tracked_sites.filter((s) => s !== site),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Configure your FocusFlow preferences</p>
        </div>

        {/* Conservativity Setting */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Prediction Conservativity</h2>
          <p className="text-sm text-gray-500 mb-4">
            Adjust how conservative your task duration predictions should be.
            Higher values account for interruptions and bad days.
          </p>
          <ConservativitySlider
            value={settings.conservativity}
            onChange={(value) =>
              setSettings({ ...settings, conservativity: value })
            }
          />
        </div>

        {/* Tracked Sites */}
        <div className="card mb-6">
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
            <button onClick={handleAddSite} className="btn btn-secondary">
              Add
            </button>
          </div>

          {/* Site list */}
          <div className="space-y-2">
            {settings.tracked_sites.map((site) => (
              <div
                key={site}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
              >
                <span className="text-sm text-gray-700">{site}</span>
                <button
                  onClick={() => handleRemoveSite(site)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            {settings.tracked_sites.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No sites configured. Add sites above.
              </p>
            )}
          </div>
        </div>

        {/* Data Management */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Data Management</h2>
          <div className="space-y-3">
            <button className="btn btn-secondary w-full">
              Export My Data
            </button>
            <button className="btn bg-red-50 text-red-700 hover:bg-red-100 w-full">
              Clear All Data
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
