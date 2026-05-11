// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.143:5000/api';

// Google Auth IDs
export const GOOGLE_CONFIG = {
  ios: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
  android: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
  web: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
};

export default {
  API_BASE_URL,
  GOOGLE_CONFIG,
};
