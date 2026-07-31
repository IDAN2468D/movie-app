/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Root Layout - CineBook
 * Sets up dark theme, RTL, fonts, and navigation container.
 */
import "../global.css";
import { useEffect } from 'react';
import { I18nManager, StatusBar, DevSettings, LogBox, View } from 'react-native';

// Silence specific development warnings
LogBox.ignoreLogs([
  '[Reanimated] Writing to `value` during component render',
]);
import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
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

import { AsyncStorage } from '@/utils/SafeModules';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

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
    if (!currentSegment) {
      return;
    }

    // 2. Authenticated: Don't allow login or onboarding screens
    if (isAuthenticated) {
      if (currentSegment === 'login' || currentSegment === 'auth' || currentSegment === 'onboarding') {
        console.log('Redirecting to Tabs (Already Authenticated)');
        setTimeout(() => router.replace('/(tabs)'), 0);
      }
      return;
    }

    // 3. Onboarding Check for Unauthenticated users: If not seen, force to onboarding
    if (!hasSeenOnboarding) {
      if (currentSegment !== 'onboarding' && currentSegment !== 'login') {
        console.log('Redirecting to Onboarding (First time user)');
        setTimeout(() => router.replace('/onboarding'), 0);
      }
      return;
    }

    // 4. Authentication Check for Unauthenticated users: If seen onboarding but not logged in
    const isPublicRoute = currentSegment === 'login' || currentSegment === 'auth' || currentSegment === 'onboarding';

    if (!isPublicRoute) {
      console.log('Redirecting to Login (Unauthenticated)');
      setTimeout(() => router.replace('/login'), 0);
    }
  }, [isAuthenticated, isLoading, segments, hasSeenOnboarding, navigationState?.key]);

  return null;
}

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

  // Hide splash screen as soon as fonts are loaded or after 800ms safety timeout
  useEffect(() => {
    const hideTimer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 800);

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }

    return () => clearTimeout(hideTimer);
  }, [fontsLoaded, fontError]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
        <ThemeProvider value={CineDarkTheme}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <RootLayoutNav />
        </ThemeProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}

function RootLayoutNav() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
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
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="movie/scanner"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="movie/[id]"
        options={{
          animation: 'slide_from_left',
          presentation: 'card',
          statusBarTranslucent: true,
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
        name="movie/snacks"
        options={{
          animation: 'slide_from_right',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="movie/snack-lab"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="movie/checkout"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="movie/ar-loom"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="movie/debate"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="movie/director"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="movie/oracle"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="movie/profile"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="movie/sphere"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="movie/spoiler-lounge"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="movie/synapse"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="movie/wayfinding"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="movie/actor/[id]"
        options={{
          animation: 'slide_from_right',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="cinematch"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'card',
        }}
      />
      {/* ── Premium AI Screens ── */}
      <Stack.Screen
        name="movie/cinevision"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="search/cinelens"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="profile/cineart"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="aiconcierge"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="arwayfinder"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="auramatch"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="hapticpreview"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="cinearc"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="cinejournal"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="squadplanner"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="productionlab"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="cinesound"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="cinesquad"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="cinedirector"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="seatauction"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="cinequiz"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="cinecollect"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="cineshare"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="cinepredict"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="cinesquad-carpool"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="cinevision-filter"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="cinevibe-heatmap"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="cinepass-wallet"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="friends" />
      <Stack.Screen name="loyalty" />
      <Stack.Screen name="map" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="auth/forgot-password" />
      <Stack.Screen name="settings/favorites" />
      <Stack.Screen name="settings/history" />
      <Stack.Screen name="settings/legacy" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/payment" />
      <Stack.Screen name="settings/security" />
      <Stack.Screen name="settings/vault" />
      </Stack>
      <InTheaterOverlay />
    </View>
  );
}
