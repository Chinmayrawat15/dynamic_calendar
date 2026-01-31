/**
 * FocusFlow Background Service Worker
 * Handles tab tracking, activity logging, and data sync.
 *
 * TODO: Person A - Implement real tab tracking and activity logging
 */

// Configuration
const CONFIG = {
  API_URL: "http://localhost:8000",
  SYNC_INTERVAL_MINUTES: 0.5, // 30 seconds
  TAB_SWITCH_THRESHOLD: 10, // Tab switches before focus drops
};

// State
let state = {
  currentTask: null,
  isTracking: false,
  activities: [],
  tabSwitches: 0,
  lastTabId: null,
  sessionStart: null,
};

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log("FocusFlow extension installed");

  // Set default storage values
  chrome.storage.local.set({
    currentTask: null,
    isTracking: false,
    focusScore: 100,
    trackedSites: ["github.com", "stackoverflow.com", "docs.google.com"],
    conservativity: 0.5,
  });

  // Create sync alarm
  chrome.alarms.create("syncActivity", {
    periodInMinutes: CONFIG.SYNC_INTERVAL_MINUTES,
  });
});

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncActivity") {
    syncActivityData();
  }
});

// Track tab changes
// TODO: Person A - Implement real tab tracking
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (!state.isTracking) return;

  // Record tab switch
  if (state.lastTabId !== null && state.lastTabId !== activeInfo.tabId) {
    state.tabSwitches++;
    updateFocusScore();
  }
  state.lastTabId = activeInfo.tabId;

  // Get tab info
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab.url) return;

    const activity = createActivityRecord(tab);
    if (activity) {
      state.activities.push(activity);
    }
  });
});

// Track URL changes
// TODO: Person A - Implement URL change tracking
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!state.isTracking || changeInfo.status !== "complete") return;
  if (!tab.url || tab.url.startsWith("chrome://")) return;

  const activity = createActivityRecord(tab);
  if (activity) {
    // Update or add activity
    const existingIndex = state.activities.findIndex(
      (a) => a.url === activity.url
    );
    if (existingIndex >= 0) {
      state.activities[existingIndex].end_time = Date.now();
      state.activities[existingIndex].duration_ms =
        state.activities[existingIndex].end_time -
        state.activities[existingIndex].start_time;
    } else {
      state.activities.push(activity);
    }
  }
});

/**
 * Create an activity record from a tab.
 * TODO: Person A - Add domain filtering based on tracked sites
 */
function createActivityRecord(tab) {
  if (!tab.url || tab.url.startsWith("chrome://")) return null;

  try {
    const url = new URL(tab.url);
    return {
      url: tab.url,
      domain: url.hostname,
      title: tab.title || "Untitled",
      duration_ms: 0,
      start_time: Date.now(),
      end_time: Date.now(),
    };
  } catch (e) {
    return null;
  }
}

/**
 * Calculate and update focus score based on tab switches.
 * TODO: Person A - Improve focus score algorithm
 */
function updateFocusScore() {
  // Simple algorithm: start at 100, lose 5 points per tab switch
  const focusScore = Math.max(0, 100 - state.tabSwitches * 5);

  // Update badge
  updateBadge(focusScore);

  // Store focus score
  chrome.storage.local.set({ focusScore });
}

/**
 * Update the extension badge with focus score.
 */
function updateBadge(focusScore) {
  // Set badge text
  chrome.action.setBadgeText({ text: focusScore.toString() });

  // Set badge color based on score
  let color = "#22c55e"; // Green
  if (focusScore < 70) color = "#eab308"; // Yellow
  if (focusScore < 40) color = "#ef4444"; // Red

  chrome.action.setBadgeBackgroundColor({ color });
}

/**
 * Sync activity data to the backend.
 * TODO: Person A - Implement real API sync
 */
async function syncActivityData() {
  if (!state.isTracking || !state.currentTask) {
    console.log("FocusFlow: Not tracking, skipping sync");
    return;
  }

  if (state.activities.length === 0) {
    console.log("FocusFlow: No activities to sync");
    return;
  }

  const focusScore = await new Promise((resolve) => {
    chrome.storage.local.get(["focusScore"], (result) => {
      resolve(result.focusScore || 100);
    });
  });

  const payload = {
    task_name: state.currentTask,
    activities: state.activities,
    tab_switches: state.tabSwitches,
    focus_score: focusScore,
  };

  console.log("FocusFlow: Syncing activity data", payload);

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("FocusFlow: Sync successful", data);

      // Clear synced activities
      state.activities = [];
    } else {
      console.error("FocusFlow: Sync failed", response.status);
    }
  } catch (error) {
    console.error("FocusFlow: Sync error", error);
    // Keep activities for retry
  }
}

/**
 * Start tracking a task.
 */
function startTracking(taskName) {
  state = {
    currentTask: taskName,
    isTracking: true,
    activities: [],
    tabSwitches: 0,
    lastTabId: null,
    sessionStart: Date.now(),
  };

  chrome.storage.local.set({
    currentTask: taskName,
    isTracking: true,
    focusScore: 100,
  });

  updateBadge(100);
  console.log("FocusFlow: Started tracking", taskName);
}

/**
 * Stop tracking.
 */
function stopTracking() {
  // Final sync before stopping
  syncActivityData();

  state = {
    currentTask: null,
    isTracking: false,
    activities: [],
    tabSwitches: 0,
    lastTabId: null,
    sessionStart: null,
  };

  chrome.storage.local.set({
    currentTask: null,
    isTracking: false,
  });

  chrome.action.setBadgeText({ text: "" });
  console.log("FocusFlow: Stopped tracking");
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "startTracking":
      startTracking(message.taskName);
      sendResponse({ success: true });
      break;

    case "stopTracking":
      stopTracking();
      sendResponse({ success: true });
      break;

    case "getState":
      chrome.storage.local.get(
        ["currentTask", "isTracking", "focusScore"],
        (result) => {
          sendResponse({
            currentTask: result.currentTask,
            isTracking: result.isTracking,
            focusScore: result.focusScore || 100,
            tabSwitches: state.tabSwitches,
          });
        }
      );
      return true; // Async response

    default:
      sendResponse({ error: "Unknown action" });
  }
});

console.log("FocusFlow: Background service worker loaded");
