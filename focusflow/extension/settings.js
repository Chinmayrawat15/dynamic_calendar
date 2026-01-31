// Settings script for managing tracked sites

const newSiteInput = document.getElementById('newSiteInput');
const addSiteBtn = document.getElementById('addSiteBtn');
const siteList = document.getElementById('siteList');
const closeBtn = document.getElementById('closeBtn');

let trackedSites = [];

// Load tracked sites on page load
document.addEventListener('DOMContentLoaded', () => {
  loadTrackedSites();
});

// Load tracked sites from storage
async function loadTrackedSites() {
  const data = await chrome.storage.local.get('trackedSites');
  trackedSites = data.trackedSites || [];
  renderSiteList();
}

// Render the site list
function renderSiteList() {
  if (trackedSites.length === 0) {
    siteList.innerHTML = '<li class="empty-state">No tracked sites yet. Add one above!</li>';
    return;
  }

  siteList.innerHTML = trackedSites.map((site, index) => `
    <li class="site-item">
      <span class="site-name">${site}</span>
      <button class="btn btn-remove" data-index="${index}">Remove</button>
    </li>
  `).join('');

  // Add event listeners to remove buttons
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      removeSite(index);
    });
  });
}

// Add a new site
addSiteBtn.addEventListener('click', () => {
  const site = newSiteInput.value.trim().toLowerCase();
  
  if (!site) {
    alert('Please enter a site domain');
    return;
  }

  // Basic validation
  if (site.includes('/') || site.includes(' ')) {
    alert('Please enter just the domain name (e.g., github.com)');
    return;
  }

  // Check for duplicates
  if (trackedSites.includes(site)) {
    alert('This site is already being tracked');
    return;
  }

  // Add the site
  trackedSites.push(site);
  saveSites();
  newSiteInput.value = '';
});

// Remove a site
function removeSite(index) {
  if (confirm(`Remove "${trackedSites[index]}" from tracking?`)) {
    trackedSites.splice(index, 1);
    saveSites();
  }
}

// Save sites to storage
async function saveSites() {
  await chrome.storage.local.set({ trackedSites });
  renderSiteList();
}

// Allow adding sites with Enter key
newSiteInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addSiteBtn.click();
  }
});

// Close window button
closeBtn.addEventListener('click', () => {
  window.close();
});
