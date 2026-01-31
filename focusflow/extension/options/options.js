/**
 * FocusFlow Options Script
 * Handles the options page for extension settings.
 *
 * TODO: Person A - Add more settings and improve UX
 */

// DOM Elements
const siteList = document.getElementById("siteList");
const newSiteInput = document.getElementById("newSiteInput");
const addSiteBtn = document.getElementById("addSiteBtn");
const apiUrlInput = document.getElementById("apiUrl");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");

// State
let trackedSites = [];

/**
 * Initialize options page.
 */
async function init() {
  // Load saved settings
  chrome.storage.local.get(
    ["trackedSites", "apiUrl"],
    (result) => {
      trackedSites = result.trackedSites || [
        "github.com",
        "stackoverflow.com",
        "docs.google.com",
      ];
      apiUrlInput.value = result.apiUrl || "http://localhost:8000";

      renderSiteList();
    }
  );
}

/**
 * Render the tracked sites list.
 */
function renderSiteList() {
  siteList.innerHTML = "";

  trackedSites.forEach((site, index) => {
    const li = document.createElement("li");
    li.className = "site-item";
    li.innerHTML = `
      <span class="site-name">${site}</span>
      <button class="btn-remove" data-index="${index}">Remove</button>
    `;
    siteList.appendChild(li);
  });

  // Add event listeners to remove buttons
  document.querySelectorAll(".btn-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      removeSite(index);
    });
  });
}

/**
 * Add a new tracked site.
 */
function addSite() {
  const site = newSiteInput.value.trim().toLowerCase();

  if (!site) return;

  // Remove http/https if present
  const cleanSite = site.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  if (trackedSites.includes(cleanSite)) {
    showStatus("Site already in list", "error");
    return;
  }

  trackedSites.push(cleanSite);
  newSiteInput.value = "";
  renderSiteList();
}

/**
 * Remove a tracked site.
 */
function removeSite(index) {
  trackedSites.splice(index, 1);
  renderSiteList();
}

/**
 * Save settings.
 */
function saveSettings() {
  chrome.storage.local.set(
    {
      trackedSites,
      apiUrl: apiUrlInput.value.trim(),
    },
    () => {
      showStatus("Settings saved!", "success");
    }
  );
}

/**
 * Export data.
 * TODO: Person A - Implement proper data export
 */
function exportData() {
  chrome.storage.local.get(null, (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "focusflow-data.json";
    a.click();
    URL.revokeObjectURL(url);
    showStatus("Data exported!", "success");
  });
}

/**
 * Clear all data.
 */
function clearData() {
  if (
    confirm(
      "Are you sure you want to clear all data? This cannot be undone."
    )
  ) {
    chrome.storage.local.clear(() => {
      trackedSites = [];
      apiUrlInput.value = "http://localhost:8000";
      renderSiteList();
      showStatus("All data cleared!", "success");
    });
  }
}

/**
 * Show status message.
 */
function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.classList.remove("hidden");

  setTimeout(() => {
    statusEl.classList.add("hidden");
  }, 3000);
}

// Event Listeners
addSiteBtn.addEventListener("click", addSite);
newSiteInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addSite();
});
saveBtn.addEventListener("click", saveSettings);
exportBtn.addEventListener("click", exportData);
clearBtn.addEventListener("click", clearData);

// Initialize
init();
