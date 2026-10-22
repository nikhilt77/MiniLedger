import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerRootComponent } from 'expo';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import { Colors } from './src/theme';

type AppState = 'loading' | 'login' | 'home';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');

  useEffect(() => {
    // Check for existing auth token
    AsyncStorage.getItem('miniledger_token').then((token) => {
      setAppState(token ? 'home' : 'login');
    });
  }, []);

  if (appState === 'loading') {
    return (
      <View style={styles.splash}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <SafeAreaView style={styles.root} edges={['top']}>
        {appState === 'login' ? (
          <LoginScreen onLogin={() => setAppState('home')} />
        ) : (
          <HomeScreen onLogout={() => setAppState('login')} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  splash: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});

registerRootComponent(App);

