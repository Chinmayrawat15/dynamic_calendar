// Popup script for Activity Tracker

let updateInterval = null;

// DOM elements
const taskInput = document.getElementById('taskInput');
const startTaskBtn = document.getElementById('startTaskBtn');
const endTaskBtn = document.getElementById('endTaskBtn');
const pauseTaskBtn = document.getElementById('pauseTaskBtn');
const currentTaskDisplay = document.getElementById('currentTaskDisplay');
const pausedTasksList = document.getElementById('pausedTasksList');
const taskTimeEl = document.getElementById('taskTime');
const taskSwitchesEl = document.getElementById('taskSwitches');
const totalSwitchesEl = document.getElementById('totalSwitches');
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
  chrome.runtime.sendMessage(
    { action: 'getStats' },
    (stats) => {
      if (!stats) return;
      
      const { activeTask, pausedTasks, isTracking } = stats;
      
      if (activeTask && isTracking) {
        // There's an active task
        taskInput.value = '';
        taskInput.disabled = false;
        taskInput.placeholder = 'Enter new task name...';
        startTaskBtn.textContent = 'Start New Task';
        startTaskBtn.disabled = false;
        endTaskBtn.disabled = false;
        if (pauseTaskBtn) pauseTaskBtn.disabled = false;
        
        currentTaskDisplay.innerHTML = `<strong>Active:</strong> ${activeTask.taskName}`;
        currentTaskDisplay.classList.add('active');
      } else {
        // No active task
        taskInput.disabled = false;
        taskInput.placeholder = 'Enter task name...';
        startTaskBtn.textContent = 'Start Task';
        startTaskBtn.disabled = false;
        endTaskBtn.disabled = true;
        if (pauseTaskBtn) pauseTaskBtn.disabled = true;
        currentTaskDisplay.innerHTML = '';
        currentTaskDisplay.classList.remove('active');
      }
      
      // Update paused tasks list
      updatePausedTasksList(pausedTasks);
    }
  );
}

// Update paused tasks list
function updatePausedTasksList(pausedTasks) {
  if (!pausedTasksList) return;
  
  if (!pausedTasks || pausedTasks.length === 0) {
    pausedTasksList.innerHTML = '<p class="empty-state">No paused tasks</p>';
    return;
  }
  
  pausedTasksList.innerHTML = pausedTasks.map(task => {
    const time = formatTime(task.totalActiveTime);
    return `
      <div class="paused-task-item">
        <div class="paused-task-info">
          <strong>${task.taskName}</strong>
          <span class="paused-task-time">${time} tracked</span>
        </div>
        <div class="paused-task-actions">
          <button class="btn-small btn-resume" data-task="${task.taskName}">Resume</button>
          <button class="btn-small btn-delete" data-task="${task.taskName}">Delete</button>
        </div>
      </div>
    `;
  }).join('');
  
  // Add event listeners to resume and delete buttons
  document.querySelectorAll('.btn-resume').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskName = e.target.dataset.task;
      resumeTask(taskName);
    });
  });
  
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskName = e.target.dataset.task;
      deleteTask(taskName);
    });
  });
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
      if (response && response.success) {
        taskInput.value = '';
        loadCurrentState();
        updateStats();
      }
    }
  );
});

// End task button click
endTaskBtn.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to end this task? It will be sent to the API.')) {
    return;
  }
  
  chrome.runtime.sendMessage(
    { action: 'endTask' },
    (response) => {
      if (response && response.success) {
        taskInput.value = '';
        loadCurrentState();
        updateStats();
      }
    }
  );
});

// Pause task button click (if exists)
if (pauseTaskBtn) {
  pauseTaskBtn.addEventListener('click', async () => {
    chrome.runtime.sendMessage(
      { action: 'pauseTask' },
      (response) => {
        if (response && response.success) {
          loadCurrentState();
          updateStats();
        }
      }
    );
  });
}

// Resume a paused task
function resumeTask(taskName) {
  chrome.runtime.sendMessage(
    { action: 'resumeTask', taskName },
    (response) => {
      if (response && response.success) {
        loadCurrentState();
        updateStats();
      }
    }
  );
}

// Delete a paused task
function deleteTask(taskName) {
  if (!confirm(`Delete task "${taskName}"? This cannot be undone.`)) {
    return;
  }
  
  chrome.runtime.sendMessage(
    { action: 'deleteTask', taskName },
    (response) => {
      if (response && response.success) {
        loadCurrentState();
        updateStats();
      }
    }
  );
}

// Update statistics
function updateStats() {
  chrome.runtime.sendMessage(
    { action: 'getStats' },
    (stats) => {
      if (!stats) return;
      
      const { activeTask, isTracking } = stats;
      
      // Update task time
      if (activeTask && isTracking) {
        // activeTask.totalActiveTime already includes current session time from getStats()
        const time = formatTime(activeTask.totalActiveTime);
        taskTimeEl.textContent = time;

        // Update tab switches
        taskSwitchesEl.textContent = activeTask.tabSwitches || 0;
      } else {
        taskTimeEl.textContent = '0m 0s';
        taskSwitchesEl.textContent = '0';
      }

      // Total switches is not tracked in new system, hide or remove this stat
      if (totalSwitchesEl) {
        totalSwitchesEl.textContent = '-';
      }
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

// Settings button - open settings page
if (settingsBtn) {
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
}

// Cleanup on popup close
window.addEventListener('unload', () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});