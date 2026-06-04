/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-require-imports */
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
  // Quietly fallback
}

// --- VIDEO ---
let isVideoSupported = false;
let VideoView: any = ({ style }: any) => (
  <View style={[{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }, style]}>
    <Text style={{ color: '#666' }}>Video Unavailable</Text>
  </View>
);
let useVideoPlayer: any = (url: string, callback?: (player: any) => void) => {
  const mockPlayer = {
    play: () => {},
    pause: () => {},
    loop: false,
    muted: false,
    status: 'idle',
    addListener: () => ({ remove: () => {} }),
    removeListener: () => {},
  };
  if (callback) {
    callback(mockPlayer);
  }
  return mockPlayer;
};

try {
  if (Platform.OS !== 'web') {
    const VideoModule = require('expo-video');
    VideoView = VideoModule.VideoView;
    useVideoPlayer = VideoModule.useVideoPlayer;
    isVideoSupported = true;
    console.log('[SafeModules] ExpoVideo native module loaded successfully!');
  } else {
    console.log('[SafeModules] ExpoVideo loaded in web mock mode.');
  }
} catch (e: any) {
  // Quietly fallback
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
  setNotificationChannelAsync: () => Promise.resolve(null),
  AndroidImportance: {
    UNSPECIFIED: 0,
    NONE: 1,
    MIN: 2,
    LOW: 3,
    DEFAULT: 4,
    HIGH: 5,
    MAX: 6,
  },
};

try {
  if (Platform.OS !== 'web') {
    Notifications = require('expo-notifications');
  }
} catch (e) {
  // Quietly fallback
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
  // Quietly fallback
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
  // Quietly fallback
}

// Named exports
export { 
  Location, 
  VideoView, useVideoPlayer, isVideoSupported,
  Notifications, 
  Gyroscope,
  AsyncStorage
};

// Grouped exports
export const Video = { VideoView, useVideoPlayer };
export const Sensors = { Gyroscope };
