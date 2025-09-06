import { useCallback, useEffect, useState } from 'react';
import WindowsNetworkSync from '../services/sync/WindowsNetworkSync';
import { ChapterInfo } from '../database/types';
import { DeviceInfo } from '../../../src/services/sync/LocalNetworkSync';

interface WindowsSyncStatus {
  isEnabled: boolean;
  isRunning: boolean;
  deviceId: string;
  deviceName: string;
  discoveredDevices: DeviceInfo[];
  queueSize: number;
}

export const useWindowsSync = () => {
  const [syncStatus, setSyncStatus] = useState<WindowsSyncStatus>({
    isEnabled: false,
    isRunning: false,
    deviceId: '',
    deviceName: '',
    discoveredDevices: [],
    queueSize: 0,
  });

  const syncManager = WindowsNetworkSync.getInstance();

  // Update sync status periodically
  useEffect(() => {
    const updateStatus = () => {
      const status = syncManager.getSyncStatus();
      setSyncStatus({
        isEnabled: status.isRunning,
        isRunning: status.isRunning,
        deviceId: status.deviceId,
        deviceName: status.deviceName,
        discoveredDevices: status.discoveredDevices,
        queueSize: status.queueSize,
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const startSync = useCallback(async () => {
    try {
      const success = await syncManager.startSyncServer();
      if (success) {
        console.log('Windows sync started successfully');
      }
      return success;
    } catch (error) {
      console.error('Failed to start Windows sync:', error);
      return false;
    }
  }, []);

  const stopSync = useCallback(() => {
    try {
      syncManager.stopSyncServer();
      console.log('Windows sync stopped');
    } catch (error) {
      console.error('Failed to stop Windows sync:', error);
    }
  }, []);

  const syncChapterProgress = useCallback((chapter: ChapterInfo, progress: number) => {
    try {
      syncManager.queueProgress(chapter, progress);
    } catch (error) {
      console.error('Failed to queue progress for sync:', error);
    }
  }, []);

  return {
    syncStatus,
    startSync,
    stopSync,
    syncChapterProgress,
    isOnline: syncStatus.discoveredDevices.length > 0,
  };
};

export default useWindowsSync;