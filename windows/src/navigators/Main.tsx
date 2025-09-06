import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, Button } from 'react-native-paper';
import { useWindowsSync } from '../hooks/useWindowsSync';

const Stack = createNativeStackNavigator();

// Main home screen for Windows
const HomeScreen = () => {
  const { syncStatus, startSync, stopSync } = useWindowsSync();

  useEffect(() => {
    // Auto-start sync on app launch
    startSync();
  }, [startSync]);

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        LNReader for Windows
      </Text>
      
      <Text variant="bodyLarge" style={styles.subtitle}>
        Light Novel Reader with Cross-Device Sync
      </Text>

      <View style={styles.syncStatus}>
        <Text variant="titleMedium">Sync Status</Text>
        <Text>Device: {syncStatus.deviceName}</Text>
        <Text>Status: {syncStatus.isRunning ? 'Running' : 'Stopped'}</Text>
        <Text>Discovered Devices: {syncStatus.discoveredDevices.length}</Text>
        <Text>Queue Size: {syncStatus.queueSize}</Text>
        
        <View style={styles.buttons}>
          <Button
            mode={syncStatus.isRunning ? 'outlined' : 'contained'}
            onPress={syncStatus.isRunning ? stopSync : startSync}
            style={styles.button}
          >
            {syncStatus.isRunning ? 'Stop Sync' : 'Start Sync'}
          </Button>
        </View>
      </View>

      <View style={styles.info}>
        <Text variant="bodyMedium">
          • Connect your Android device to the same WiFi network{'\n'}
          • Enable sync on your Android device{'\n'}
          • Reading progress will sync automatically{'\n'}
          • Most advanced reading position wins
        </Text>
      </View>
    </View>
  );
};

const Main = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 32,
    textAlign: 'center',
    color: '#666',
  },
  syncStatus: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    minWidth: 300,
    alignItems: 'center',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  button: {
    marginHorizontal: 4,
  },
  info: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    maxWidth: 400,
  },
});

export default Main;