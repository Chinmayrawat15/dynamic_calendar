// Background service worker for Activity Tracker

let currentTabId = null;
let currentUrl = null;
let sessionStartTime = null;
let currentTask = null;
let taskStartTime = null;

// Activity data structure
let activityData = {
  tabSwitches: [],
  siteTime: {},
  taskSessions: []
};

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Activity Tracker installed');
  initializeStorage();
});

// Initialize storage with default values
async function initializeStorage() {
  const data = await chrome.storage.local.get(['trackedSites', 'activityData']);
  
  if (!data.trackedSites) {
    await chrome.storage.local.set({
      trackedSites: ['github.com', 'stackoverflow.com', 'youtube.com']
    });
  }
  
  if (!data.activityData) {
    await chrome.storage.local.set({ activityData });
  } else {
    activityData = data.activityData;
  }
}

// Track tab activation (tab switches)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  await handleTabSwitch(tab);
});

// Track tab updates (URL changes)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    await handleTabSwitch(tab);
  }
});

// Handle tab switches and time tracking
async function handleTabSwitch(tab) {
  const now = Date.now();
  const newUrl = tab.url || '';
  const newTabId = tab.id;
  
  // End tracking on previous tab
  if (currentUrl && sessionStartTime) {
    const timeSpent = now - sessionStartTime;
    await updateSiteTime(currentUrl, timeSpent);
  }
  
  // Log the tab switch
  const tabSwitch = {
    timestamp: now,
    fromTabId: currentTabId,
    toTabId: newTabId,
    fromUrl: currentUrl,
    toUrl: newUrl
  };
  
  activityData.tabSwitches.push(tabSwitch);
  
  // Update current tracking
  currentTabId = newTabId;
  currentUrl = newUrl;
  sessionStartTime = now;
  
  // Save to storage
  await chrome.storage.local.set({ activityData });
  
  console.log('Tab switch:', tabSwitch);
}

// Update time spent on a site
async function updateSiteTime(url, timeSpent) {
  try {
    const hostname = new URL(url).hostname;
    const data = await chrome.storage.local.get('trackedSites');
    const trackedSites = data.trackedSites || [];
    
    // Check if this site should be tracked
    const isTracked = trackedSites.some(site => hostname.includes(site));
    
    if (isTracked) {
      if (!activityData.siteTime[hostname]) {
        activityData.siteTime[hostname] = 0;
      }
      activityData.siteTime[hostname] += timeSpent;
      
      console.log(`Time on ${hostname}: ${activityData.siteTime[hostname]}ms`);
    }
  } catch (error) {
    console.error('Error updating site time:', error);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startTask') {
    startTask(request.taskName);
    sendResponse({ success: true });
  } else if (request.action === 'endTask') {
    endTask();
    sendResponse({ success: true });
  } else if (request.action === 'getStats') {
    getStats().then(stats => sendResponse(stats));
    return true; // Will respond asynchronously
  }
});

// Start a task
function startTask(taskName) {
  currentTask = taskName;
  taskStartTime = Date.now();
  
  chrome.storage.local.set({
    currentTask: taskName,
    taskStartTime: taskStartTime
  });
  
  console.log('Task started:', taskName);
}

// End a task
async function endTask() {
  if (currentTask && taskStartTime) {
    const taskSession = {
      taskName: currentTask,
      startTime: taskStartTime,
      endTime: Date.now(),
      duration: Date.now() - taskStartTime,
      tabSwitches: activityData.tabSwitches.filter(
        sw => sw.timestamp >= taskStartTime
      ).length
    };
    
    activityData.taskSessions.push(taskSession);
    
    await chrome.storage.local.set({
      activityData,
      currentTask: null,
      taskStartTime: null
    });
    
    currentTask = null;
    taskStartTime = null;
    
    console.log('Task ended:', taskSession);
  }
}

// Get current statistics
async function getStats() {
  const data = await chrome.storage.local.get(['currentTask', 'taskStartTime']);
  
  let currentTaskTime = 0;
  let currentTaskSwitches = 0;
  
  if (data.currentTask && data.taskStartTime) {
    currentTaskTime = Date.now() - data.taskStartTime;
    currentTaskSwitches = activityData.tabSwitches.filter(
      sw => sw.timestamp >= data.taskStartTime
    ).length;
  }
  
  return {
    currentTask: data.currentTask || null,
    currentTaskTime,
    currentTaskSwitches,
    totalTabSwitches: activityData.tabSwitches.length,
    siteTime: activityData.siteTime,
    recentSwitches: activityData.tabSwitches.slice(-10)
  };
}

// Send activity data to server every 30 seconds
setInterval(async () => {
  await sendActivityData();
}, 30000);

// Send activity data to localhost:8000/api/activity CURRENYLY NO NEED FOR THIS 
async function sendActivityData() {
  try {
    const data = await chrome.storage.local.get(['currentTask', 'taskStartTime']);
    /*
    const payload = {
      timestamp: Date.now(),
      currentTask: data.currentTask || null,
      taskStartTime: data.taskStartTime || null,
      tabSwitches: activityData.tabSwitches,
      siteTime: activityData.siteTime,
      taskSessions: activityData.taskSessions,
      currentUrl: currentUrl,
      currentTabId: currentTabId
    };
    */
   // below is trying to integrate with amishs code
    const payload = {
      task_name: data.currentTask || null,
      domain: currentUrl,
      title: currentUrl,
      duration_ms: 99999,
      focus_score: 50,
      tab_switches: 5,
      timestamp: Date.now(),
    };
    // task_name, domain, title, duration_ms, focus_score
    // tab_switches, timestamp
    
    const response = await fetch('http://localhost:8000/api/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      console.log('Activity data sent successfully');
    } else {
      console.error('Failed to send activity data:', response.status);
    }
  } catch (error) {
    console.error('Error sending activity data:', error);
  }
}

// Handle extension startup - get current active tab
chrome.runtime.onStartup.addListener(async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    await handleTabSwitch(tabs[0]);
  }
});
