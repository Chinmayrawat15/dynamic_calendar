# Activity Tracker Chrome Extension

A Chrome extension that tracks your time spent on websites, monitors tab switches, and logs activity data to a local server.

## Features

- **Task Management**: Start and end tasks with custom names
- **Time Tracking**: Automatically track time spent on user-defined websites
- **Tab Switch Detection**: Log every tab switch with timestamps
- **Real-time Statistics**: View current task time, tab switches, and site usage
- **Data Sync**: Automatically send activity data to localhost:8000/api/activity every 30 seconds
- **Customizable**: Manage which sites to track through settings

## Installation

1. **Download/Clone this extension**
   - Save all files in a directory called `activity-tracker`

2. **Create placeholder icons** (or use your own):
   ```bash
   # The extension needs three icon files:
   # - icon16.png (16x16 pixels)
   # - icon48.png (48x48 pixels)
   # - icon128.png (128x128 pixels)
   ```

3. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `activity-tracker` directory

4. **Set up your backend server**:
   - Create an API endpoint at `http://localhost:8000/api/activity`
   - The endpoint should accept POST requests with JSON data

## Usage

### Starting a Task

1. Click the extension icon in Chrome toolbar
2. Enter a task name (e.g., "Writing Report")
3. Click "Start Task"
4. The extension will now track your activity

### Ending a Task

1. Click the extension icon
2. Click "End Task"
3. Task data will be logged and stats will reset

### Managing Tracked Sites

1. Click "Manage Tracked Sites" in the popup
2. Add domains you want to track (e.g., "github.com")
3. Remove sites you no longer want to track

### Viewing Statistics

The popup shows:
- **Time on Current Task**: How long you've been working on the current task
- **Tab Switches (Current Task)**: Number of tab switches during this task
- **Total Tab Switches**: All tab switches since extension loaded
- **Time on Tracked Sites**: Breakdown of time spent on each tracked site
- **Recent Tab Switches**: Last 10 tab switches with timestamps

## API Data Format

The extension sends data to `localhost:8000/api/activity` in this format:

```json
{
  "timestamp": 1706745600000,
  "currentTask": "Writing Report",
  "taskStartTime": 1706745000000,
  "tabSwitches": [
    {
      "timestamp": 1706745100000,
      "fromTabId": 123,
      "toTabId": 456,
      "fromUrl": "https://github.com",
      "toUrl": "https://stackoverflow.com"
    }
  ],
  "siteTime": {
    "github.com": 120000,
    "stackoverflow.com": 90000
  },
  "taskSessions": [
    {
      "taskName": "Previous Task",
      "startTime": 1706740000000,
      "endTime": 1706744000000,
      "duration": 4000000,
      "tabSwitches": 15
    }
  ],
  "currentUrl": "https://stackoverflow.com/questions/...",
  "currentTabId": 456
}
```

## Backend Server Example

Here's a simple Express.js server to receive the data:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/activity', (req, res) => {
  console.log('Activity data received:', req.body);
  // Store data in database, file, etc.
  res.json({ success: true });
});

app.listen(8000, () => {
  console.log('Server running on http://localhost:8000');
});
```

## File Structure

```
activity-tracker/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Service worker for tracking
├── popup.html            # Main popup interface
├── popup.css             # Popup styles
├── popup.js              # Popup functionality
├── settings.html         # Settings page
├── settings.js           # Settings functionality
├── icon16.png           # 16x16 icon
├── icon48.png           # 48x48 icon
└── icon128.png          # 128x128 icon
```

## Permissions

The extension requires:
- `tabs`: To track tab switches and URLs
- `storage`: To store tracked sites and activity data
- `activeTab`: To access active tab information
- `<all_urls>`: To track time on any website

## Privacy

- All data is stored locally in Chrome's storage
- Data is only sent to your local server (localhost:8000)
- No data is sent to external servers
- You have full control over what sites are tracked

## Troubleshooting

### Extension not tracking sites
- Make sure the sites are added in settings
- Check that the domain matches exactly (e.g., "github.com")

### Data not being sent to server
- Ensure your server is running on port 8000
- Check browser console for errors
- Verify CORS settings on your server

### Stats not updating
- Refresh the popup by closing and reopening it
- Check that you've started a task

## License

MIT License - Feel free to modify and use as needed!
