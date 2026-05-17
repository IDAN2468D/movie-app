import React from 'react';
import { View, Text, Platform } from 'react-native';

/**
 * SafeModules Utility
 * Prevents "Cannot find native module" crashes in environments like standard Expo Go
 * by using dynamic require and providing robust mocks for missing modules.
 */



// --- LOCATION ---
let Location: any = {
  requestForegroundPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
  getCurrentPositionAsync: () => Promise.resolve({ coords: { latitude: 32.0853, longitude: 34.7818 } }),
  getLastKnownPositionAsync: () => Promise.resolve({ coords: { latitude: 32.0853, longitude: 34.7818 } }),
  installWebDeviceLocationPolyfill: () => {},
};

try {
  if (Platform.OS !== 'web') {
    Location = require('expo-location');
  }
} catch (e) {
  console.warn('SafeModules: ExpoLocation not available');
}

// --- VIDEO ---
let VideoView: any = ({ style }: any) => (
  <View style={[{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }, style]}>
    <Text style={{ color: '#666' }}>Video Unavailable</Text>
  </View>
);
let useVideoPlayer: any = (url: string, callback?: (player: any) => void) => {
  return {
    play: () => {},
    pause: () => {},
    loop: false,
    muted: false,
    addListener: () => ({ remove: () => {} }),
    removeListener: () => {},
  };
};

try {
  if (Platform.OS !== 'web') {
    const VideoModule = require('expo-video');
    VideoView = VideoModule.VideoView;
    useVideoPlayer = VideoModule.useVideoPlayer;
  }
} catch (e) {
  console.warn('SafeModules: ExpoVideo not available');
}

// --- NOTIFICATIONS ---
let Notifications: any = {
  setNotificationHandler: () => {},
  addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  addNotificationReceivedListener: () => ({ remove: () => {} }),
  getPermissionsAsync: () => Promise.resolve({ status: 'denied' }),
  requestPermissionsAsync: () => Promise.resolve({ status: 'denied' }),
  getExpoPushTokenAsync: () => Promise.resolve({ data: 'mock-token' }),
  scheduleNotificationAsync: () => Promise.resolve('mock-id'),
  cancelAllScheduledNotificationsAsync: () => Promise.resolve(),
};

try {
  if (Platform.OS !== 'web') {
    Notifications = require('expo-notifications');
  }
} catch (e) {
  console.warn('SafeModules: ExpoNotifications not available');
}

// --- SENSORS ---
let Gyroscope: any = {
  isAvailableAsync: () => Promise.resolve(false),
  setUpdateInterval: () => {},
  addListener: () => ({ remove: () => {} }),
};

try {
  if (Platform.OS !== 'web') {
    const SensorsModule = require('expo-sensors');
    Gyroscope = SensorsModule.Gyroscope;
  }
} catch (e) {
  console.warn('SafeModules: ExpoSensors not available');
}

// --- ASYNC STORAGE ---
let AsyncStorage: any = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
  clear: () => Promise.resolve(),
  getAllKeys: () => Promise.resolve([]),
  multiGet: () => Promise.resolve([]),
  multiSet: () => Promise.resolve(),
  multiRemove: () => Promise.resolve(),
  multiMerge: () => Promise.resolve(),
};

try {
  // Use dynamic require to prevent crash on import
  const AS = require('@react-native-async-storage/async-storage').default;
  // Safety check: sometimes the module is imported but its native part is null
  if (AS && typeof AS.getItem === 'function') {
    AsyncStorage = AS;
  } else {
    throw new Error('AsyncStorage native module is null');
  }
} catch (e) {
  console.warn('SafeModules: AsyncStorage not available, using mock');
}

// Named exports
export { 
  Location, 
  VideoView, useVideoPlayer, 
  Notifications, 
  Gyroscope,
  AsyncStorage
};

// Grouped exports
export const Video = { VideoView, useVideoPlayer };
export const Sensors = { Gyroscope };
