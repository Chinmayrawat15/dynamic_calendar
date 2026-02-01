// Background service worker for Activity Tracker
// All state is stored in chrome.storage to survive service worker restarts

// Storage keys:
// - activeTaskState: { task: {...}, sessionStartTime: timestamp, currentUrl: string }
// - pausedTasks: Array of paused tasks
// - timerWindowId: Window ID for floating timer

// ============================================================================
// INITIALIZATION
// ============================================================================

chrome.runtime.onInstalled.addListener(async () => {
  console.log('Activity Tracker installed');
  await initializeStorage();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('Activity Tracker started');
  // Resume tracking on current tab if there's an active task
  const state = await getActiveState();
  if (state) {
    await updateCurrentTab();
  }
});

// Initialize storage with default values
async function initializeStorage() {
  const data = await chrome.storage.local.get(['trackedSites', 'pausedTasks', 'activeTaskState']);

  if (!data.trackedSites) {
    await chrome.storage.local.set({
      trackedSites: ['github.com', 'stackoverflow.com', 'youtube.com']
    });
  }

  if (!data.pausedTasks) {
    await chrome.storage.local.set({ pausedTasks: [] });
  }

  // If there's an active task from previous session, resume tracking
  if (data.activeTaskState) {
    await updateCurrentTab();
    console.log('Active task restored:', data.activeTaskState.task.taskName);
  }
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

// Get active task state from storage (no side effects)
async function getActiveState() {
  const data = await chrome.storage.local.get('activeTaskState');
  return data.activeTaskState || null;
}

// Update active task state in storage
async function setActiveState(taskState) {
  await chrome.storage.local.set({ activeTaskState: taskState });
}

// Clear active task state
async function clearActiveState() {
  await chrome.storage.local.remove('activeTaskState');
}

// Update current tab info in active state
async function updateCurrentTab() {
  const state = await getActiveState();
  if (!state) return;

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      state.currentUrl = tabs[0].url || '';
      state.sessionStartTime = Date.now();
      await setActiveState(state);
      console.log('Tracking on:', state.currentUrl);
    }
  } catch (error) {
    console.error('Error updating current tab:', error);
  }
}

// ============================================================================
// TAB TRACKING
// ============================================================================

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const state = await getActiveState();
  if (!state) return;

  const tab = await chrome.tabs.get(activeInfo.tabId);
  await handleTabSwitch(tab);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const state = await getActiveState();
  if (!state) return;

  if (changeInfo.status === 'complete' && tab.active) {
    await handleTabSwitch(tab);
  }
});

async function handleTabSwitch(tab) {
  const state = await getActiveState();
  if (!state) return;

  const now = Date.now();
  const newUrl = tab.url || '';

  // Save time spent on previous tab
  if (state.currentUrl && state.sessionStartTime) {
    const timeSpent = now - state.sessionStartTime;
    await updateSiteTime(state.currentUrl, timeSpent);
  }

  // Increment tab switch counter
  state.task.tabSwitches++;

  // Update to new tab
  state.currentUrl = newUrl;
  state.sessionStartTime = now;

  await setActiveState(state);
  console.log('Tab switch recorded for task:', state.task.taskName);
}

async function updateSiteTime(url, timeSpent) {
  const state = await getActiveState();
  if (!state) return;

  try {
    const hostname = new URL(url).hostname;

    if (!state.task.siteTime[hostname]) {
      state.task.siteTime[hostname] = 0;
    }
    state.task.siteTime[hostname] += timeSpent;
    state.task.totalActiveTime += timeSpent;

    await setActiveState(state);
    console.log(`Time on ${hostname}: ${state.task.siteTime[hostname]}ms`);
  } catch (error) {
    console.error('Error updating site time:', error);
  }
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request).then(sendResponse);
  return true; // Keep message channel open for async response
});

async function handleMessage(request) {
  switch (request.action) {
    case 'startTask':
      await startTask(request.taskName);
      return { success: true };

    case 'pauseTask':
      await pauseCurrentTask();
      return { success: true };

    case 'resumeTask':
      await resumeTask(request.taskName);
      return { success: true };

    case 'endTask':
      await endTask();
      return { success: true };

    case 'deleteTask':
      await deleteTask(request.taskName);
      return { success: true };

    case 'getStats':
      return await getStats();

    default:
      return { success: false, error: 'Unknown action' };
  }
}

// ============================================================================
// TASK MANAGEMENT
// ============================================================================

async function startTask(taskName) {
  // If there's already an active task, pause it first
  const existingState = await getActiveState();
  if (existingState) {
    await pauseCurrentTask();
  }

  const task = {
    taskName: taskName,
    startTimestamp: Date.now(),
    totalActiveTime: 0,
    tabSwitches: 0,
    siteTime: {},
    pauseIntervals: []
  };

  // Get current tab
  let currentUrl = '';
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      currentUrl = tabs[0].url || '';
    }
  } catch (error) {
    console.error('Error getting current tab:', error);
  }

  const state = {
    task: task,
    sessionStartTime: Date.now(),
    currentUrl: currentUrl
  };

  await setActiveState(state);
  // await openTimerWindow();

  console.log('Task started:', taskName);
}

async function pauseCurrentTask() {
  const state = await getActiveState();
  if (!state) return;

  const now = Date.now();

  // Save time spent on current tab
  if (state.currentUrl && state.sessionStartTime) {
    const timeSpent = now - state.sessionStartTime;
    await updateSiteTime(state.currentUrl, timeSpent);
  }

  // Record the pause
  state.task.pauseIntervals.push({
    pausedAt: now,
    resumedAt: null
  });

  // Move to paused tasks
  const data = await chrome.storage.local.get('pausedTasks');
  const pausedTasks = data.pausedTasks || [];
  pausedTasks.push(state.task);

  await chrome.storage.local.set({ pausedTasks });
  await clearActiveState();
  // await closeTimerWindow();

  console.log('Task paused:', state.task.taskName);
}

async function resumeTask(taskName) {
  // CRITICAL FIX: Pause current task FIRST, then get fresh pausedTasks data
  const existingState = await getActiveState();
  if (existingState) {
    await pauseCurrentTask();
  }

  // Get fresh data AFTER pausing (this fixes the bug)
  const data = await chrome.storage.local.get('pausedTasks');
  const pausedTasks = data.pausedTasks || [];

  const taskIndex = pausedTasks.findIndex(t => t.taskName === taskName);
  if (taskIndex === -1) {
    console.error('Paused task not found:', taskName);
    return;
  }

  // Remove from paused tasks
  const [task] = pausedTasks.splice(taskIndex, 1);

  // Mark the pause interval as resumed
  const lastPause = task.pauseIntervals[task.pauseIntervals.length - 1];
  if (lastPause && !lastPause.resumedAt) {
    lastPause.resumedAt = Date.now();
  }

  // Get current tab
  let currentUrl = '';
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      currentUrl = tabs[0].url || '';
    }
  } catch (error) {
    console.error('Error getting current tab:', error);
  }

  const state = {
    task: task,
    sessionStartTime: Date.now(),
    currentUrl: currentUrl
  };

  await setActiveState(state);
  await chrome.storage.local.set({ pausedTasks });
  // await openTimerWindow();

  console.log('Task resumed:', taskName);
}

async function deleteTask(taskName) {
  const data = await chrome.storage.local.get('pausedTasks');
  const pausedTasks = data.pausedTasks || [];

  const filteredTasks = pausedTasks.filter(t => t.taskName !== taskName);
  await chrome.storage.local.set({ pausedTasks: filteredTasks });

  console.log('Task deleted:', taskName);
  // No notification shown (as requested in plan.md)
}

async function endTask() {
  const state = await getActiveState();
  if (!state) {
    console.error('No active task to end');
    return;
  }

  const now = Date.now();

  // Save time spent on current tab
  if (state.currentUrl && state.sessionStartTime) {
    const timeSpent = now - state.sessionStartTime;
    await updateSiteTime(state.currentUrl, timeSpent);
  }

  // Get final state with updated time
  const finalState = await getActiveState();
  const task = finalState.task;

  // Calculate focus score and process site time
  const focusScore = calculateFocusScore(task);
  const siteTimeProcessed = processSiteTime(task.siteTime);

  // Send to API
  await sendTaskToAPI(task, focusScore, siteTimeProcessed);

  // Clear active task
  await clearActiveState();
  // await closeTimerWindow();

  console.log('Task completed and sent to API:', task.taskName);
}

// ============================================================================
// TIMER WINDOW (Disabled for now)
// ============================================================================

// async function openTimerWindow() {
//   const existingWindow = await chrome.storage.local.get('timerWindowId');

//   if (existingWindow.timerWindowId) {
//     try {
//       await chrome.windows.update(existingWindow.timerWindowId, { focused: true });
//       return;
//     } catch (error) {
//       // Window doesn't exist anymore
//     }
//   }

//   const window = await chrome.windows.create({
//     url: 'timer-window.html',
//     type: 'popup',
//     width: 280,
//     height: 170,
//     top: 50,
//     left: screen.width - 330,
//     focused: false
//   });

//   await chrome.storage.local.set({ timerWindowId: window.id });
// }

// async function closeTimerWindow() {
//   const existingWindow = await chrome.storage.local.get('timerWindowId');

//   if (existingWindow.timerWindowId) {
//     try {
//       await chrome.windows.remove(existingWindow.timerWindowId);
//     } catch (error) {
//       // Window already closed
//     }
//     await chrome.storage.local.remove('timerWindowId');
//   }
// }

// ============================================================================
// STATISTICS
// ============================================================================

async function getStats() {
  const data = await chrome.storage.local.get(['activeTaskState', 'pausedTasks']);

  let activeTask = null;

  if (data.activeTaskState) {
    // Clone the task and add current session time
    activeTask = JSON.parse(JSON.stringify(data.activeTaskState.task));

    if (data.activeTaskState.currentUrl && data.activeTaskState.sessionStartTime) {
      const currentSessionTime = Date.now() - data.activeTaskState.sessionStartTime;

      try {
        const hostname = new URL(data.activeTaskState.currentUrl).hostname;

        if (!activeTask.siteTime[hostname]) {
          activeTask.siteTime[hostname] = 0;
        }
        activeTask.siteTime[hostname] += currentSessionTime;
        activeTask.totalActiveTime += currentSessionTime;
      } catch (error) {
        console.error('Error calculating current session time:', error);
      }
    }
  }

  return {
    activeTask: activeTask,
    pausedTasks: data.pausedTasks || [],
    isTracking: !!data.activeTaskState
  };
}

// ============================================================================
// FOCUS SCORE & DATA PROCESSING
// ============================================================================

function calculateFocusScore(task) {
  let score = 100;

  // Penalize for tab switches (>1 switch per minute)
  const taskDurationMinutes = task.totalActiveTime / 60000;
  const switchesPerMinute = task.tabSwitches / Math.max(taskDurationMinutes, 1);
  score -= Math.min(switchesPerMinute * 5, 30);

  // Penalize for pauses
  score -= Math.min(task.pauseIntervals.length * 5, 20);

  // Penalize for scattered focus (too many sites)
  const uniqueSites = Object.keys(task.siteTime).length;
  score -= Math.min(uniqueSites * 2, 20);

  return Math.max(Math.round(score), 0);
}

function processSiteTime(siteTime) {
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  const processed = {};
  let otherTime = 0;

  for (const [site, time] of Object.entries(siteTime)) {
    if (time < FIVE_MINUTES_MS) {
      otherTime += time;
    } else {
      processed[site] = time;
    }
  }

  if (otherTime > 0) {
    processed['other'] = otherTime;
  }

  return processed;
}

async function sendTaskToAPI(task, focusScore, siteTimeProcessed) {
  try {
    let primaryDomain = 'unknown';
    let maxTime = 0;

    for (const [site, time] of Object.entries(task.siteTime)) {
      if (time > maxTime) {
        maxTime = time;
        primaryDomain = site;
      }
    }

    const payload = {
      task_name: task.taskName,
      domain: primaryDomain,
      title: task.taskName,
      duration_ms: task.totalActiveTime,
      focus_score: focusScore,
      tab_switches: task.tabSwitches,
      timestamp: task.startTimestamp
    };

    const response = await fetch('http://localhost:8000/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('Task data sent to API successfully');
      console.log('Full site time data:', siteTimeProcessed);
    } else {
      console.error('Failed to send task data:', response.status);
    }
  } catch (error) {
    console.error('Error sending task data:', error);
  }
}
