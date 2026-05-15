/**
 * Root Layout - CineBook
 * Sets up dark theme, RTL, fonts, and navigation container.
 */
import { useEffect } from 'react';
import { I18nManager, StatusBar, DevSettings } from 'react-native';
import "../global.css";
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '@/constants/Theme';
import { cssInterop } from 'react-native-css-interop';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useFonts } from 'expo-font';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Rubik_400Regular, Rubik_500Medium, Rubik_700Bold, Rubik_900Black } from '@expo-google-fonts/rubik';
import { Assistant_400Regular, Assistant_500Medium, Assistant_600SemiBold, Assistant_700Bold } from '@expo-google-fonts/assistant';
import { useAuthStore } from '@/store/useAuthStore';
import { NotificationService } from '../services/NotificationService';

cssInterop(LinearGradient, { className: 'style' });


// 1. RTL initialization - Force Right-to-Left for Hebrew
if (!I18nManager.isRTL) {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    // On some platforms, we need to reload to apply native-side changes
    if (typeof DevSettings !== 'undefined' && DevSettings?.reload) {
      DevSettings.reload();
    }
  } catch (e) {
    console.error('Failed to set RTL:', e);
  }
}

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const CineDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.primary,
  },
};

export default function RootLayout() {
  const checkAuth = useAuthStore(state => state.checkAuth);
  
  const isLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const hasSeenOnboarding = useAuthStore(state => state.hasSeenOnboarding);
  const segments = useSegments();
  const router = useRouter();
  
  const [fontsLoaded, fontError] = useFonts({
    'Anton-Regular': Anton_400Regular,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Rubik-Regular': Rubik_400Regular,
    'Rubik-Medium': Rubik_500Medium,
    'Rubik-Bold': Rubik_700Bold,
    'Rubik-Black': Rubik_900Black,
    'Assistant-Regular': Assistant_400Regular,
    'Assistant-Medium': Assistant_500Medium,
    'Assistant-SemiBold': Assistant_600SemiBold,
    'Assistant-Bold': Assistant_700Bold,
  });

  useEffect(() => {
    checkAuth();
    // Initialize notifications
    NotificationService.initHandler();
  }, [checkAuth]);

  // Auth and Onboarding routing logic
  useEffect(() => {
    if (isLoading) return;

    const currentSegment = segments[0];

    console.log('Navigation Guard:', {
      currentSegment,
      hasSeenOnboarding,
      isAuthenticated,
      segments
    });

    // 1. Initial State: Always allow root index (Splash) to run its animation
    if (!currentSegment) {
      return;
    }

    // 2. Onboarding Check: If not seen, force user to onboarding (unless they are at index/onboarding)
    if (!hasSeenOnboarding) {
      if (currentSegment !== 'onboarding') {
        console.log('Redirecting to Onboarding (First time user)');
        router.replace('/onboarding');
      }
      return;
    }

    // 3. Authentication Check: If seen onboarding but not logged in
    if (!isAuthenticated) {
      // Allow login, auth, and onboarding (onboarding is technically unprotected but we handled it above)
      const isPublicRoute = currentSegment === 'login' || currentSegment === 'auth' || currentSegment === 'onboarding';
      
      if (!isPublicRoute) {
        console.log('Redirecting to Login (Unauthenticated)');
        router.replace('/login');
      }
    } else {
      // 4. Authenticated: Don't allow login or onboarding screens
      if (currentSegment === 'login' || currentSegment === 'auth' || currentSegment === 'onboarding') {
        console.log('Redirecting to Tabs (Already Authenticated)');
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading, segments, router, hasSeenOnboarding]);

  // Hide splash screen as soon as fonts are loaded
  // This allows our custom app/index.tsx splash animation to take over
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={CineDarkTheme}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { 
              backgroundColor: Colors.background,
            },
            animation: 'slide_from_bottom',
          }}
        >
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="movie/[id]"
            options={{
              animation: 'slide_from_left',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="movie/seats"
            options={{
              animation: 'slide_from_bottom',
              presentation: 'modal',
            }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
