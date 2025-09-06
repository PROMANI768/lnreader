import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';

import { createTables } from './src/database/db';
import AppErrorBoundary from './src/components/AppErrorBoundary/AppErrorBoundary';
import Main from './src/navigators/Main';

// Initialize database
createTables();

const App = () => {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <AppErrorBoundary>
        <SafeAreaProvider>
          <PaperProvider>
            <StatusBar translucent={true} backgroundColor="transparent" />
            <Main />
          </PaperProvider>
        </SafeAreaProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
};

export default App;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});