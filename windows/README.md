# LNReader for Windows

A React Native Windows implementation of LNReader with local network sync capabilities.

## Features

- ✅ Auto-scroll to last reading position
- ✅ Local WiFi network sync with Android app
- ✅ Offline reading with progress tracking
- ✅ Most advanced reading position wins conflicts
- ✅ Same UI as Android version

## Setup

1. **Prerequisites**
   ```bash
   npm install -g @react-native-community/cli
   ```

2. **Install Dependencies**
   ```bash
   yarn install
   ```

3. **Run Windows App**
   ```bash
   yarn windows
   ```

## Sync Setup

1. Ensure both Windows and Android devices are on the same WiFi network
2. Start sync on both devices
3. Devices will automatically discover each other
4. Reading progress syncs in real-time
5. Most advanced reading position is always kept

## Architecture

- **Database**: SQLite3 for Windows compatibility
- **Sync**: HTTP server for local network communication
- **UI**: Same React Native components as Android
- **Discovery**: Network scanning for device detection

## File Structure

```
src/
├── components/     # Shared UI components
├── database/       # SQLite database layer
├── hooks/          # React hooks for sync
├── navigators/     # Navigation setup
└── services/       # Sync and networking services
```

## Development

- Auto-reload enabled for development
- TypeScript support
- ESLint and Prettier configured
- Path aliases configured for clean imports

## Sync Protocol

1. Each device runs HTTP server on port 8765
2. Devices broadcast presence via UDP
3. Progress data exchanged via HTTP APIs
4. Conflict resolution: highest progress wins
5. Offline queue syncs when devices reconnect