import { useCallback, useEffect, useState } from 'react';
import { MMKVStorage } from '@utils/mmkv/mmkv';
import LocalNetworkSync, { SyncProgress, DeviceInfo } from '@services/sync/LocalNetworkSync';
import { ChapterInfo } from '@database/types';
import { showToast } from '@utils/showToast';

interface SyncStatus {
  isEnabled: boolean;
  isRunning: boolean;
  deviceId: string;
  deviceName: string;
  discoveredDevices: DeviceInfo[];
  lastSyncTime: number | null;
}

export const useSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isEnabled: false,
    isRunning: false,
    deviceId: '',
    deviceName: '',
    discoveredDevices: [],
    lastSyncTime: null,
  });

  const syncManager = LocalNetworkSync.getInstance();

  // Initialize sync status from storage
  useEffect(() => {
    const initializeSyncStatus = () => {
      const isEnabled = MMKVStorage.getBoolean('SYNC_ENABLED') || false;
      const deviceId = MMKVStorage.getString('SYNC_DEVICE_ID') || '';
      const deviceName = MMKVStorage.getString('SYNC_DEVICE_NAME') || '';
      const lastSyncTime = MMKVStorage.getNumber('LAST_SYNC_TIME') || null;

      setSyncStatus(prev => ({
        ...prev,
        isEnabled,
        deviceId,
        deviceName,
        lastSyncTime,
      }));

      // Auto-start sync if enabled
      if (isEnabled) {
        startSync();
      }
    };

    initializeSyncStatus();
  }, []);

  // Update sync status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (syncStatus.isRunning) {
        const status = syncManager.getSyncStatus();
        setSyncStatus(prev => ({
          ...prev,
          isRunning: status.isRunning,
          discoveredDevices: status.discoveredDevices,
        }));
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [syncStatus.isRunning]);

  const startSync = useCallback(async () => {
    try {
      const success = await syncManager.startSync();
      if (success) {
        const status = syncManager.getSyncStatus();
        setSyncStatus(prev => ({
          ...prev,
          isEnabled: true,
          isRunning: true,
          deviceId: status.deviceId,
          deviceName: status.deviceName,
        }));
      }
      return success;
    } catch (error) {
      console.error('Failed to start sync:', error);
      showToast('Failed to start local sync');
      return false;
    }
  }, []);

  const stopSync = useCallback(() => {
    try {
      syncManager.stopSync();
      setSyncStatus(prev => ({
        ...prev,
        isEnabled: false,
        isRunning: false,
        discoveredDevices: [],
      }));
    } catch (error) {
      console.error('Failed to stop sync:', error);
      showToast('Failed to stop sync');
    }
  }, []);

  const syncChapterProgress = useCallback(async (chapter: ChapterInfo, progress: number) => {
    if (!syncStatus.isEnabled || !syncStatus.isRunning) {
      return;
    }

    try {
      const syncProgress: SyncProgress = {
        novelId: chapter.novelId,
        chapterId: chapter.id,
        progress: progress,
        deviceId: syncStatus.deviceId,
        deviceName: syncStatus.deviceName,
        timestamp: Date.now(),
      };

      // Queue progress for syncing
      const queuedProgress = MMKVStorage.getString('SYNC_PROGRESS_QUEUE');
      const queue: SyncProgress[] = queuedProgress ? JSON.parse(queuedProgress) : [];
      
      // Remove existing entry for this chapter
      const filteredQueue = queue.filter(p => 
        !(p.novelId === chapter.novelId && p.chapterId === chapter.id)
      );
      
      // Add new progress
      filteredQueue.push(syncProgress);
      
      // Keep only last 100 entries to prevent queue from growing too large
      const trimmedQueue = filteredQueue.slice(-100);
      
      MMKVStorage.set('SYNC_PROGRESS_QUEUE', JSON.stringify(trimmedQueue));

      // Try to sync immediately
      await syncManager.syncProgress(trimmedQueue);
      
      // Update last sync time
      const lastSyncTime = Date.now();
      MMKVStorage.set('LAST_SYNC_TIME', lastSyncTime);
      setSyncStatus(prev => ({ ...prev, lastSyncTime }));

    } catch (error) {
      console.error('Failed to sync chapter progress:', error);
    }
  }, [syncStatus.isEnabled, syncStatus.isRunning, syncStatus.deviceId, syncStatus.deviceName]);

  const forceSyncAll = useCallback(async () => {
    if (!syncStatus.isEnabled || !syncStatus.isRunning) {
      showToast('Sync is not enabled');
      return;
    }

    try {
      showToast('Starting full sync...');
      
      // Get all progress from queue
      const queuedProgress = MMKVStorage.getString('SYNC_PROGRESS_QUEUE');
      const queue: SyncProgress[] = queuedProgress ? JSON.parse(queuedProgress) : [];
      
      if (queue.length === 0) {
        showToast('No progress to sync');
        return;
      }

      await syncManager.syncProgress(queue);
      
      const lastSyncTime = Date.now();
      MMKVStorage.set('LAST_SYNC_TIME', lastSyncTime);
      setSyncStatus(prev => ({ ...prev, lastSyncTime }));
      
      showToast(`Synced ${queue.length} reading progress entries`);
    } catch (error) {
      console.error('Failed to force sync:', error);
      showToast('Failed to sync progress');
    }
  }, [syncStatus.isEnabled, syncStatus.isRunning]);

  const clearSyncData = useCallback(() => {
    try {
      MMKVStorage.delete('SYNC_PROGRESS_QUEUE');
      MMKVStorage.delete('LAST_SYNC_TIME');
      setSyncStatus(prev => ({ ...prev, lastSyncTime: null }));
      showToast('Sync data cleared');
    } catch (error) {
      console.error('Failed to clear sync data:', error);
      showToast('Failed to clear sync data');
    }
  }, []);

  return {
    syncStatus,
    startSync,
    stopSync,
    syncChapterProgress,
    forceSyncAll,
    clearSyncData,
    isOnline: syncStatus.discoveredDevices.length > 0,
  };
};

export default useSync;