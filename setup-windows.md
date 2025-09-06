# Setting Up LNReader with Cross-Device Sync

## Overview

LNReader now supports automatic cross-device sync between Android and Windows devices on the same WiFi network. Your reading progress syncs seamlessly without requiring any cloud services.

## Features Implemented

✅ **Auto-scroll to last reading position**
- Automatically scrolls to where you left off when reopening a chapter
- Works in both scroll and page reading modes
- Respects user interactions (disables auto-scroll after manual scrolling)

✅ **Local WiFi Network Sync**
- Discovers other LNReader devices on the same WiFi automatically
- Syncs reading progress in real-time
- No internet connection required
- No cloud services or external accounts needed

✅ **Windows React Native App**
- Same UI and functionality as Android version
- Native Windows app experience
- SQLite database for offline storage

✅ **Conflict Resolution**
- Most advanced reading position always wins
- Timestamp-based conflict resolution for same progress
- Automatic merging of progress from multiple devices

✅ **Offline Support**
- Queues progress updates when devices are offline
- Syncs automatically when devices reconnect
- Maintains reading progress locally if no other devices found

## Setup Instructions

### Android Device

1. **Enable Sync**
   - Go to Settings → Sync Settings
   - Toggle "Local Network Sync" ON
   - Device will start advertising on WiFi network

2. **Reading**
   - Open any chapter and start reading
   - Progress is saved automatically
   - Auto-scroll to last position works immediately

### Windows Device

1. **Install & Run**
   ```bash
   cd /app/windows
   yarn install
   yarn windows
   ```

2. **Start Sync**
   - App auto-starts sync on launch
   - Will show discovered Android devices
   - Progress syncs automatically

### Both Devices

- **Must be on same WiFi network**
- **Sync happens automatically every 10 seconds**
- **Most advanced reading position wins conflicts**

## How It Works

### Device Discovery
- Each device runs HTTP server on port 8765
- Devices scan local network for other LNReader instances
- Automatic discovery and connection

### Progress Sync
- Reading progress stored as percentage (0-100%)
- Synced with device ID, timestamp, and progress data
- Conflict resolution keeps highest progress percentage

### Auto-scroll Implementation
- WebView JavaScript injection for smooth scrolling
- Calculates scroll position from progress percentage
- Waits for content load before scrolling
- Disables after user interaction to prevent interference

## File Changes Made

### Android App Enhancements
- `/app/src/screens/reader/components/WebViewReader.tsx` - Auto-scroll functionality
- `/app/src/screens/reader/hooks/useChapter.ts` - Sync integration
- `/app/src/services/sync/LocalNetworkSync.ts` - Network sync service
- `/app/src/hooks/useSync.ts` - React hook for sync functionality
- `/app/src/screens/settings/SyncSettings.tsx` - Settings UI

### Windows App (New)
- `/app/windows/` - Complete React Native Windows app
- Same UI components and navigation as Android
- SQLite database compatible with Android schema
- Windows-specific sync implementation

## Usage

1. **Start reading on Android device**
2. **Reading progress auto-saves and syncs**
3. **Open same novel/chapter on Windows**
4. **Automatically scrolls to exact position**
5. **Continue reading on either device seamlessly**

## Technical Details

- **Port**: 8765 for sync communication
- **Protocol**: HTTP for progress exchange
- **Discovery**: Network scanning + UDP broadcast
- **Database**: SQLite on both platforms
- **Conflict Resolution**: Highest progress + timestamp wins
- **Auto-scroll**: JavaScript injection in WebView
- **Queue**: Offline progress stored locally until sync

The implementation provides a seamless cross-device reading experience that works completely offline within your local network.