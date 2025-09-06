import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, List, Switch, Text, Button, Card, Chip } from 'react-native-paper';
import { useTheme } from '@hooks/persisted';
import { useSync } from '@hooks/useSync';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SyncSettingsProps {
  navigation: any;
}

const SyncSettings: React.FC<SyncSettingsProps> = ({ navigation }) => {
  const theme = useTheme();
  const { top } = useSafeAreaInsets();
  const { 
    syncStatus, 
    startSync, 
    stopSync, 
    forceSyncAll, 
    clearSyncData,
    isOnline 
  } = useSync();

  const handleToggleSync = async () => {
    if (syncStatus.isEnabled) {
      stopSync();
    } else {
      await startSync();
    }
  };

  const formatLastSyncTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Appbar.Header 
        style={[{ marginTop: top }, { backgroundColor: theme.surface }]}
        statusBarHeight={0}
      >
        <Appbar.BackAction onPress={navigation.goBack} />
        <Appbar.Content title="Sync Settings" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Sync Status Card */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <View style={styles.statusRow}>
              <Text variant="titleMedium">Local Network Sync</Text>
              <Switch
                value={syncStatus.isEnabled}
                onValueChange={handleToggleSync}
              />
            </View>
            
            <Text variant="bodyMedium" style={[styles.description, { color: theme.onSurfaceVariant }]}>
              Automatically sync reading progress with other LNReader devices on the same WiFi network
            </Text>

            {syncStatus.isEnabled && (
              <View style={styles.statusInfo}>
                <View style={styles.statusIndicator}>
                  <Chip 
                    icon={syncStatus.isRunning ? "wifi" : "wifi-off"}
                    style={[
                      styles.statusChip, 
                      { backgroundColor: syncStatus.isRunning ? theme.primary : theme.errorContainer }
                    ]}
                    textStyle={{ color: syncStatus.isRunning ? theme.onPrimary : theme.onErrorContainer }}
                  >
                    {syncStatus.isRunning ? 'Running' : 'Stopped'}
                  </Chip>
                  
                  <Chip 
                    icon={isOnline ? "devices" : "device-off"}
                    style={[
                      styles.statusChip, 
                      { backgroundColor: isOnline ? theme.secondary : theme.outline }
                    ]}
                    textStyle={{ color: isOnline ? theme.onSecondary : theme.onSurface }}
                  >
                    {syncStatus.discoveredDevices.length} devices
                  </Chip>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Device Info */}
        {syncStatus.isEnabled && (
          <Card style={[styles.card, { backgroundColor: theme.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>This Device</Text>
              <List.Item
                title="Device Name"
                description={syncStatus.deviceName || 'Unknown Device'}
                left={props => <List.Icon {...props} icon="phone" />}
              />
              <List.Item
                title="Device ID"
                description={syncStatus.deviceId.substring(0, 12) + '...' || 'Not available'}
                left={props => <List.Icon {...props} icon="identifier" />}
              />
            </Card.Content>
          </Card>
        )}

        {/* Discovered Devices */}
        {syncStatus.discoveredDevices.length > 0 && (
          <Card style={[styles.card, { backgroundColor: theme.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Discovered Devices</Text>
              {syncStatus.discoveredDevices.map((device, index) => (
                <List.Item
                  key={device.id}
                  title={device.name}
                  description={`${device.ip}:${device.port} • Last seen: ${formatLastSyncTime(device.lastSeen)}`}
                  left={props => <List.Icon {...props} icon="laptop" />}
                  right={props => (
                    <Chip 
                      icon="check-circle" 
                      style={{ backgroundColor: theme.primary }}
                      textStyle={{ color: theme.onPrimary }}
                    >
                      Connected
                    </Chip>
                  )}
                />
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Sync Actions */}
        {syncStatus.isEnabled && (
          <Card style={[styles.card, { backgroundColor: theme.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Sync Actions</Text>
              
              <View style={styles.actionRow}>
                <Button
                  mode="contained"
                  onPress={forceSyncAll}
                  disabled={!syncStatus.isRunning}
                  style={styles.actionButton}
                  icon="sync"
                >
                  Sync Now
                </Button>
                
                <Button
                  mode="outlined"
                  onPress={clearSyncData}
                  style={styles.actionButton}
                  icon="delete-sweep"
                >
                  Clear Data
                </Button>
              </View>

              <Text variant="bodySmall" style={[styles.lastSync, { color: theme.onSurfaceVariant }]}>
                Last sync: {formatLastSyncTime(syncStatus.lastSyncTime)}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Help Section */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>How it works</Text>
            <Text variant="bodyMedium" style={{ color: theme.onSurfaceVariant }}>
              • Devices must be connected to the same WiFi network{'\n'}
              • Reading progress syncs automatically in the background{'\n'}
              • Most advanced reading position wins in case of conflicts{'\n'}
              • Works completely offline - no internet required{'\n'}
              • Data is only shared between your devices
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  statusInfo: {
    marginTop: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  lastSync: {
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SyncSettings;