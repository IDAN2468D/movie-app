/**
 * Root Layout - CineBook
 * Sets up dark theme, RTL, fonts, and navigation container.
 */
import { useEffect } from 'react';
import { I18nManager, StatusBar, DevSettings } from 'react-native';
import "../global.css";
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
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
import NotificationService from '../services/NotificationService';
import InTheaterOverlay from '@/components/InTheaterOverlay';
import OfflineBanner from '@/components/OfflineBanner';

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

function NavigationGuard() {
  const checkAuth = useAuthStore(state => state.checkAuth);
  const isLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const hasSeenOnboarding = useAuthStore(state => state.hasSeenOnboarding);
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    checkAuth();
    // Initialize notifications
    NotificationService.initHandler();
  }, [checkAuth]);

  // Auth and Onboarding routing logic
  useEffect(() => {
    if (isLoading || !navigationState?.key) return;

    const currentSegment = segments[0];

    // 1. Initial State: Always allow root index (Splash) to run its animation
    if (!currentSegment || currentSegment === '(tabs)' && segments.length === 1) {
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
      // Allow login, auth, and onboarding
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
  }, [isAuthenticated, isLoading, segments, hasSeenOnboarding]);

  return null;
}

import { AsyncStorage } from '@/utils/SafeModules';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000,
});

export default function RootLayout() {
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

  // Hide splash screen as soon as fonts are loaded
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={CineDarkTheme}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
          <RootLayoutNav />
        </ThemeProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}

function RootLayoutNav() {
  return (
    <>
      <NavigationGuard />
      <OfflineBanner />
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
        <Stack.Screen
          name="movie/lounge"
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="cinematch"
          options={{
            animation: 'slide_from_bottom',
            presentation: 'card',
          }}
        />
      </Stack>
      <InTheaterOverlay />
    </>
  );
}


