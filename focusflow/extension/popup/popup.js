/**
 * FocusFlow Popup Script
 * Handles the popup UI interactions.
 *
 * TODO: Person A - Add more features and polish UI
 */

// DOM Elements
const focusScoreEl = document.getElementById("focusScore");
const scoreValueEl = focusScoreEl.querySelector(".score-value");
const trackingView = document.getElementById("trackingView");
const startView = document.getElementById("startView");
const currentTaskNameEl = document.getElementById("currentTaskName");
const tabSwitchesEl = document.getElementById("tabSwitches");
const taskInput = document.getElementById("taskInput");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

/**
 * Initialize popup state from background.
 */
async function init() {
  // Get current state from background
  chrome.runtime.sendMessage({ action: "getState" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error getting state:", chrome.runtime.lastError);
      return;
    }

    updateUI(response);
  });
}

/**
 * Update UI based on state.
 */
function updateUI(state) {
  const { currentTask, isTracking, focusScore, tabSwitches } = state;

  // Update focus score
  scoreValueEl.textContent = focusScore;
  updateFocusScoreStyle(focusScore);

  if (isTracking && currentTask) {
    // Show tracking view
    trackingView.classList.remove("hidden");
    startView.classList.add("hidden");
    currentTaskNameEl.textContent = currentTask;
    tabSwitchesEl.textContent = tabSwitches || 0;
  } else {
    // Show start view
    trackingView.classList.add("hidden");
    startView.classList.remove("hidden");
  }
}

/**
 * Update focus score visual style.
 */
function updateFocusScoreStyle(score) {
  focusScoreEl.classList.remove("high", "medium", "low");

  if (score >= 70) {
    focusScoreEl.classList.add("high");
  } else if (score >= 40) {
    focusScoreEl.classList.add("medium");
  } else {
    focusScoreEl.classList.add("low");
  }
}

/**
 * Handle start tracking.
 */
function handleStartTracking() {
  const taskName = taskInput.value.trim();
  if (!taskName) return;

  chrome.runtime.sendMessage(
    { action: "startTracking", taskName },
    (response) => {
      if (response.success) {
        updateUI({
          currentTask: taskName,
          isTracking: true,
          focusScore: 100,
          tabSwitches: 0,
        });
        taskInput.value = "";
      }
    }
  );
}

/**
 * Handle stop tracking.
 */
function handleStopTracking() {
  chrome.runtime.sendMessage({ action: "stopTracking" }, (response) => {
    if (response.success) {
      updateUI({
        currentTask: null,
        isTracking: false,
        focusScore: 100,
        tabSwitches: 0,
      });
    }
  });
}

// Event Listeners
taskInput.addEventListener("input", () => {
  startBtn.disabled = !taskInput.value.trim();
});

taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && taskInput.value.trim()) {
    handleStartTracking();
  }
});

startBtn.addEventListener("click", handleStartTracking);
stopBtn.addEventListener("click", handleStopTracking);

// Initialize
init();

// Refresh state periodically
setInterval(() => {
  chrome.runtime.sendMessage({ action: "getState" }, (response) => {
    if (!chrome.runtime.lastError) {
      updateUI(response);
    }
  });
}, 2000);
