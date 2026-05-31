import { GOOGLE_CONFIG } from '@/constants/Config';

let GoogleSignin: any;
let isGoogleSigninAvailable = false;

try {
  // Use require inside try-catch to prevent crash at import time in environments without the native module
  const NativeModule = require('@react-native-google-signin/google-signin');
  if (NativeModule && NativeModule.GoogleSignin) {
    GoogleSignin = NativeModule.GoogleSignin;
    isGoogleSigninAvailable = true;
  } else {
    throw new Error('GoogleSignin is not available on the imported module');
  }
} catch (e) {
  // Silent fallback mock to prevent runtime exceptions
  GoogleSignin = {
    configure: (config?: any) => {
      // Quietly configure
    },
    hasPlayServices: async () => {
      console.log('[SafeGoogleSignin Mock] hasPlayServices called');
      return false;
    },
    signIn: async () => {
      console.log('[SafeGoogleSignin Mock] signIn called');
      throw new Error('Google Sign-In is not supported in Expo Go. Please use a development build.');
    },
    signOut: async () => {
      console.log('[SafeGoogleSignin Mock] signOut called');
    },
    getCurrentUser: () => {
      console.log('[SafeGoogleSignin Mock] getCurrentUser called');
      return null;
    },
    getTokens: async () => {
      console.log('[SafeGoogleSignin Mock] getTokens called');
      return { accessToken: '', idToken: '' };
    },
    addScopes: async (scopesObj?: any) => {
      console.log('[SafeGoogleSignin Mock] addScopes called with:', scopesObj);
      return null;
    }
  };
}

export { GoogleSignin, isGoogleSigninAvailable };
