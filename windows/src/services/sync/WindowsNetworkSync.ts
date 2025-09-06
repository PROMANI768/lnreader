import { SyncProgress, DeviceInfo } from '../../../src/services/sync/LocalNetworkSync';
import { ChapterInfo } from '../../database/types';
import { updateChapterProgress } from '../../database/queries/ChapterQueries';
import DeviceInfo from 'react-native-device-info';

// Windows-specific network sync implementation
class WindowsNetworkSync {
  private static instance: WindowsNetworkSync;
  private server: any = null; // Would be Express server in real implementation
  private discoveredDevices: Map<string, DeviceInfo> = new Map();
  private syncPort = 8765;
  private isRunning = false;
  private deviceId: string = '';
  private deviceName: string = '';
  private progressQueue: SyncProgress[] = [];

  private constructor() {
    this.initializeDevice();
  }

  public static getInstance(): WindowsNetworkSync {
    if (!WindowsNetworkSync.instance) {
      WindowsNetworkSync.instance = new WindowsNetworkSync();
    }
    return WindowsNetworkSync.instance;
  }

  private async initializeDevice() {
    try {
      this.deviceId = await DeviceInfo.getUniqueId();
      this.deviceName = await DeviceInfo.getDeviceName();
    } catch (error) {
      console.log('Failed to get Windows device info:', error);
      this.deviceId = `windows-${Math.random().toString(36).substring(7)}`;
      this.deviceName = 'LNReader Windows';
    }
  }

  // Start HTTP server for sync
  public async startSyncServer(): Promise<boolean> {
    if (this.isRunning) {
      return true;
    }

    try {
      // In real implementation, would start Express server
      console.log(`Starting Windows sync server on port ${this.syncPort}`);
      
      // Simulate server start
      this.isRunning = true;
      this.startDeviceDiscovery();
      this.startPeriodicSync();
      
      console.log('Windows sync server started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start Windows sync server:', error);
      return false;
    }
  }

  // Stop sync server
  public stopSyncServer() {
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
      console.log('Windows sync server stopped');
    } catch (error) {
      console.error('Failed to stop sync server:', error);
    }
  }

  // Start device discovery using network scanning
  private startDeviceDiscovery() {
    console.log('Starting Windows device discovery...');
    
    // In real implementation, would scan local network for LNReader devices
    // Using UDP broadcast or network scanning
    setInterval(() => {
      this.scanForDevices();
    }, 30000); // Scan every 30 seconds
  }

  // Scan local network for LNReader devices
  private async scanForDevices() {
    try {
      // In real implementation, would scan common IP ranges
      // For now, simulate device discovery
      console.log('Scanning for LNReader devices on network...');
      
      // Would check ports 8765 on local network range (192.168.1.1-254, etc.)
      // and look for LNReader identification response
    } catch (error) {
      console.error('Device scan failed:', error);
    }
  }

  // Start periodic sync with discovered devices
  private startPeriodicSync() {
    setInterval(async () => {
      if (this.progressQueue.length > 0 && this.discoveredDevices.size > 0) {
        await this.syncWithAllDevices();
      }
    }, 10000); // Sync every 10 seconds
  }

  // Sync with all discovered devices
  private async syncWithAllDevices() {
    console.log(`Syncing with ${this.discoveredDevices.size} devices`);
    
    for (const [deviceId, device] of this.discoveredDevices) {
      try {
        await this.syncWithDevice(device);
      } catch (error) {
        console.error(`Sync failed with device ${device.name}:`, error);
      }
    }
  }

  // Sync with specific device
  private async syncWithDevice(device: DeviceInfo) {
    try {
      const url = `http://${device.ip}:${device.port}/api/sync/progress`;
      
      // Get remote progress
      const remoteResponse = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });
      
      if (!remoteResponse.ok) {
        throw new Error(`HTTP ${remoteResponse.status}`);
      }
      
      const remoteProgress: SyncProgress[] = await remoteResponse.json();
      
      // Merge progress (keep most advanced)
      const mergedProgress = this.mergeProgress(this.progressQueue, remoteProgress);
      
      // Update local database
      for (const progress of mergedProgress) {
        if (progress.deviceId !== this.deviceId) {
          await updateChapterProgress(progress.chapterId, progress.progress);
        }
      }
      
      // Send merged progress back to device
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          deviceName: this.deviceName,
          progress: mergedProgress,
          timestamp: Date.now(),
        }),
        timeout: 5000,
      });
      
      console.log(`Successfully synced with ${device.name}`);
    } catch (error) {
      console.error(`Failed to sync with ${device.name}:`, error);
    }
  }

  // Merge progress arrays (keep most advanced)
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

  // Add progress to queue for syncing
  public queueProgress(chapter: ChapterInfo, progress: number) {
    const syncProgress: SyncProgress = {
      novelId: chapter.novelId,
      chapterId: chapter.id,
      progress: progress,
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      timestamp: Date.now(),
    };

    // Remove existing entry for this chapter
    this.progressQueue = this.progressQueue.filter(p => 
      !(p.novelId === chapter.novelId && p.chapterId === chapter.id)
    );
    
    // Add new progress
    this.progressQueue.push(syncProgress);
    
    // Keep queue size manageable
    if (this.progressQueue.length > 1000) {
      this.progressQueue = this.progressQueue.slice(-1000);
    }
  }

  // Add discovered device
  public addDiscoveredDevice(deviceInfo: DeviceInfo) {
    if (deviceInfo.id !== this.deviceId) {
      this.discoveredDevices.set(deviceInfo.id, {
        ...deviceInfo,
        lastSeen: Date.now(),
      });
      console.log(`Windows discovered device: ${deviceInfo.name} (${deviceInfo.ip})`);
    }
  }

  // Get sync status
  public getSyncStatus() {
    return {
      isRunning: this.isRunning,
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      discoveredDevices: Array.from(this.discoveredDevices.values()),
      port: this.syncPort,
      queueSize: this.progressQueue.length,
    };
  }

  // Handle incoming sync request (from HTTP server)
  public async handleSyncRequest(requestData: any): Promise<SyncProgress[]> {
    try {
      const { deviceId, deviceName, progress, timestamp } = requestData;
      
      // Add requesting device to discovered devices
      if (deviceId !== this.deviceId) {
        // Would extract IP from request in real implementation
        this.addDiscoveredDevice({
          id: deviceId,
          name: deviceName,
          ip: '192.168.1.100', // Placeholder
          port: this.syncPort,
          lastSeen: timestamp,
        });
      }
      
      // Merge progress
      const mergedProgress = this.mergeProgress(this.progressQueue, progress);
      
      // Update local database with new progress
      for (const p of mergedProgress) {
        if (p.deviceId !== this.deviceId) {
          await updateChapterProgress(p.chapterId, p.progress);
        }
      }
      
      return mergedProgress;
    } catch (error) {
      console.error('Failed to handle sync request:', error);
      return this.progressQueue;
    }
  }
}

export default WindowsNetworkSync;