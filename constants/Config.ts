// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://movie-app-server-olet.onrender.com/api';

// Google Auth IDs
export const GOOGLE_CONFIG = {
  ios: 'your_ios_client_id_here',
  // Note: For Android, we primarily use the webClientId in the configure() call.
  // The Android client is identified via the google-services.json file.
  web: '814484714037-i2dt2kfij62esbutul7i4htv2u7maeol.apps.googleusercontent.com',
};

export default {
  API_BASE_URL,
  GOOGLE_CONFIG,
};
