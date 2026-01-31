// Popup script for Activity Tracker

let updateInterval = null;

// DOM elements
const taskInput = document.getElementById('taskInput');
const startTaskBtn = document.getElementById('startTaskBtn');
const endTaskBtn = document.getElementById('endTaskBtn');
const currentTaskDisplay = document.getElementById('currentTaskDisplay');
const taskTimeEl = document.getElementById('taskTime');
const taskSwitchesEl = document.getElementById('taskSwitches');
const totalSwitchesEl = document.getElementById('totalSwitches');
const siteTimeList = document.getElementById('siteTimeList');
const recentSwitches = document.getElementById('recentSwitches');
const settingsBtn = document.getElementById('settingsBtn');

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  loadCurrentState();
  updateStats();
  
  // Update stats every second
  updateInterval = setInterval(updateStats, 1000);
});

// Load current task state
async function loadCurrentState() {
  const data = await chrome.storage.local.get(['currentTask', 'taskStartTime']);
  
  if (data.currentTask && data.taskStartTime) {
    taskInput.value = data.currentTask;
    taskInput.disabled = true;
    startTaskBtn.disabled = true;
    endTaskBtn.disabled = false;
    
    currentTaskDisplay.innerHTML = `<strong>Active:</strong> ${data.currentTask}`;
    currentTaskDisplay.classList.add('active');
  } else {
    taskInput.disabled = false;
    startTaskBtn.disabled = false;
    endTaskBtn.disabled = true;
    currentTaskDisplay.classList.remove('active');
  }
}

// Start task button click
startTaskBtn.addEventListener('click', async () => {
  const taskName = taskInput.value.trim();
  
  if (!taskName) {
    alert('Please enter a task name');
    return;
  }
  
  // Send message to background script
  chrome.runtime.sendMessage(
    { action: 'startTask', taskName },
    (response) => {
      if (response.success) {
        loadCurrentState();
        updateStats();
      }
    }
  );
});

// End task button click
endTaskBtn.addEventListener('click', async () => {
  chrome.runtime.sendMessage(
    { action: 'endTask' },
    (response) => {
      if (response.success) {
        taskInput.value = '';
        loadCurrentState();
        updateStats();
      }
    }
  );
});

// Update statistics
function updateStats() {
  chrome.runtime.sendMessage(
    { action: 'getStats' },
    (stats) => {
      if (!stats) return;
      
      // Update task time
      if (stats.currentTask) {
        const time = formatTime(stats.currentTaskTime);
        taskTimeEl.textContent = time;
      } else {
        taskTimeEl.textContent = '0m 0s';
      }
      
      // Update tab switches
      taskSwitchesEl.textContent = stats.currentTaskSwitches;
      totalSwitchesEl.textContent = stats.totalTabSwitches;
      
      // Update site time
      updateSiteTimeList(stats.siteTime);
      
      // Update recent switches
      updateRecentSwitches(stats.recentSwitches);
    }
  );
}

// Format milliseconds to readable time
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Update site time list
function updateSiteTimeList(siteTime) {
  if (!siteTime || Object.keys(siteTime).length === 0) {
    siteTimeList.innerHTML = '<p class="empty-state">No tracked site activity yet</p>';
    return;
  }
  
  const sortedSites = Object.entries(siteTime)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Show top 10
  
  siteTimeList.innerHTML = sortedSites.map(([site, time]) => `
    <div class="site-item">
      <span class="site-name">${truncateText(site, 30)}</span>
      <span class="site-time">${formatTime(time)}</span>
    </div>
  `).join('');
}

// Update recent switches list
function updateRecentSwitches(switches) {
  if (!switches || switches.length === 0) {
    recentSwitches.innerHTML = '<p class="empty-state">No recent activity</p>';
    return;
  }
  
  recentSwitches.innerHTML = switches
    .slice()
    .reverse()
    .map(sw => {
      const time = new Date(sw.timestamp).toLocaleTimeString();
      const url = sw.toUrl || 'Unknown';
      const hostname = extractHostname(url);
      
      return `
        <div class="recent-item">
          <div class="recent-time">${time}</div>
          <div class="recent-url">${truncateText(hostname, 45)}</div>
        </div>
      `;
    }).join('');
}

// Extract hostname from URL
function extractHostname(url) {
  try {
    return new URL(url).hostname || url;
  } catch {
    return url;
  }
}

// Truncate text
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Settings button - open settings page
settingsBtn.addEventListener('click', () => {
  const width = 500;
  const height = 400;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;
  
  chrome.windows.create({
    url: 'settings.html',
    type: 'popup',
    width: width,
    height: height,
    left: Math.round(left),
    top: Math.round(top)
  });
});

// Cleanup on popup close
window.addEventListener('unload', () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});
