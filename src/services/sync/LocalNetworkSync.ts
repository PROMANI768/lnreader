import { ChapterInfo } from '@database/types';
import { updateChapterProgress } from '@database/queries/ChapterQueries';
import { showToast } from '@utils/showToast';
import DeviceInfo from 'react-native-device-info';
import { MMKVStorage } from '@utils/mmkv/mmkv';

export interface SyncProgress {
  novelId: number;
  chapterId: number;
  progress: number;
  deviceId: string;
  deviceName: string;
  timestamp: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  ip: string;
  port: number;
  lastSeen: number;
}

class LocalNetworkSync {
  private static instance: LocalNetworkSync;
  private server: any = null;
  private discoveredDevices: Map<string, DeviceInfo> = new Map();
  private syncPort = 8765;
  private isRunning = false;
  private deviceId: string = '';
  private deviceName: string = '';

  private constructor() {
    this.initializeDevice();
  }

  public static getInstance(): LocalNetworkSync {
    if (!LocalNetworkSync.instance) {
      LocalNetworkSync.instance = new LocalNetworkSync();
    }
    return LocalNetworkSync.instance;
  }

  private async initializeDevice() {
    try {
      this.deviceId = await DeviceInfo.getUniqueId();
      this.deviceName = await DeviceInfo.getDeviceName();
    } catch (error) {
      console.log('Failed to get device info:', error);
      this.deviceId = Math.random().toString(36).substring(7);
      this.deviceName = 'LNReader Device';
    }
  }

  // Start the local sync server
  public async startSync(): Promise<boolean> {
    if (this.isRunning) {
      return true;
    }

    try {
      // Note: In React Native, we'd need a native module for HTTP server
      // For now, this is the structure - implementation would require native module
      console.log(`Starting LNReader sync server on port ${this.syncPort}`);
      
      // Store sync status
      MMKVStorage.set('SYNC_ENABLED', true);
      MMKVStorage.set('SYNC_DEVICE_ID', this.deviceId);
      MMKVStorage.set('SYNC_DEVICE_NAME', this.deviceName);
      
      this.isRunning = true;
      this.startDeviceDiscovery();
      
      showToast('Local sync started - ready to sync with other devices on WiFi');
      return true;
    } catch (error) {
      console.error('Failed to start sync server:', error);
      showToast('Failed to start local sync');
      return false;
    }
  }

  // Stop the sync server
  public stopSync() {
    if (!this.isRunning) {
      return;
    }

    try {
      if (this.server) {
        this.server.close();
        this.server = null;
      }
      
      this.isRunning = false;
      this.discoveredDevices.clear();
      
      MMKVStorage.set('SYNC_ENABLED', false);
      showToast('Local sync stopped');
    } catch (error) {
      console.error('Failed to stop sync server:', error);
    }
  }

  // Start device discovery on local network
  private startDeviceDiscovery() {
    // Device discovery using UDP broadcast
    // This would require native implementation
    console.log('Starting device discovery on local network...');
    
    // Simulate device discovery for development
    setTimeout(() => {
      this.broadcastDevicePresence();
    }, 1000);
  }

  // Broadcast device presence to network
  private broadcastDevicePresence() {
    const deviceInfo = {
      id: this.deviceId,
      name: this.deviceName,
      port: this.syncPort,
      timestamp: Date.now(),
      type: 'lnreader_device'
    };

    console.log('Broadcasting device presence:', deviceInfo);
    // Implementation would use UDP broadcast
  }

  // Sync progress with discovered devices
  public async syncProgress(chapterProgress: SyncProgress[]): Promise<void> {
    if (!this.isRunning || this.discoveredDevices.size === 0) {
      return;
    }

    console.log(`Syncing progress with ${this.discoveredDevices.size} devices`);

    for (const [deviceId, device] of this.discoveredDevices) {
      try {
        await this.syncWithDevice(device, chapterProgress);
      } catch (error) {
        console.error(`Failed to sync with device ${device.name}:`, error);
      }
    }
  }

  // Sync with a specific device
  private async syncWithDevice(device: DeviceInfo, localProgress: SyncProgress[]): Promise<void> {
    try {
      // Get remote progress from device
      const remoteProgress = await this.getProgressFromDevice(device);
      
      // Merge progress (keep most advanced)
      const mergedProgress = this.mergeProgress(localProgress, remoteProgress);
      
      // Update local database with merged progress
      for (const progress of mergedProgress) {
        if (progress.deviceId !== this.deviceId) {
          await updateChapterProgress(progress.chapterId, progress.progress);
        }
      }
      
      // Send updated progress back to device
      await this.sendProgressToDevice(device, mergedProgress);
      
    } catch (error) {
      console.error(`Sync failed with ${device.name}:`, error);
    }
  }

  // Get progress from remote device
  private async getProgressFromDevice(device: DeviceInfo): Promise<SyncProgress[]> {
    // Implementation would make HTTP request to device
    const url = `http://${device.ip}:${device.port}/api/sync/progress`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Failed to get progress from ${device.name}:`, error);
      return [];
    }
  }

  // Send progress to remote device
  private async sendProgressToDevice(device: DeviceInfo, progress: SyncProgress[]): Promise<void> {
    const url = `http://${device.ip}:${device.port}/api/sync/progress`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: this.deviceId,
          deviceName: this.deviceName,
          progress: progress,
          timestamp: Date.now(),
        }),
        timeout: 5000,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Failed to send progress to ${device.name}:`, error);
    }
  }

  // Merge progress from multiple devices (keep most advanced)
  private mergeProgress(local: SyncProgress[], remote: SyncProgress[]): SyncProgress[] {
    const merged = new Map<string, SyncProgress>();
    
    // Add local progress
    for (const progress of local) {
      const key = `${progress.novelId}-${progress.chapterId}`;
      merged.set(key, progress);
    }
    
    // Merge remote progress (keep most advanced)
    for (const progress of remote) {
      const key = `${progress.novelId}-${progress.chapterId}`;
      const existing = merged.get(key);
      
      if (!existing || progress.progress > existing.progress || 
          (progress.progress === existing.progress && progress.timestamp > existing.timestamp)) {
        merged.set(key, progress);
      }
    }
    
    return Array.from(merged.values());
  }

  // Add discovered device
  public addDiscoveredDevice(deviceInfo: DeviceInfo) {
    if (deviceInfo.id !== this.deviceId) {
      this.discoveredDevices.set(deviceInfo.id, {
        ...deviceInfo,
        lastSeen: Date.now(),
      });
      console.log(`Discovered LNReader device: ${deviceInfo.name} (${deviceInfo.ip})`);
    }
  }

  // Get current sync status
  public getSyncStatus() {
    return {
      isRunning: this.isRunning,
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      discoveredDevices: Array.from(this.discoveredDevices.values()),
      port: this.syncPort,
    };
  }

  // Get current device progress for syncing
  public async getCurrentProgress(): Promise<SyncProgress[]> {
    // This would query the database for all chapter progress
    // Implementation depends on database structure
    try {
      // Placeholder - would get from database
      const progress: SyncProgress[] = [];
      return progress;
    } catch (error) {
      console.error('Failed to get current progress:', error);
      return [];
    }
  }
}

export default LocalNetworkSync;