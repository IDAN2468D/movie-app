/**
 * Tab Layout - Premium Bottom Navigation
 */
import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, Platform, ActivityIndicator, View } from 'react-native';
import { Home, Search, Ticket, User, Bookmark } from 'lucide-react-native';
import { Colors, Typography } from '@/constants/Theme';
import { useEffect } from 'react';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 0.5,
          paddingTop: 8,
          position: 'absolute',
          elevation: 0,
          height: 68 + (insets.bottom > 0 ? insets.bottom : 20),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'בית',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'חיפוש',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'רשימה',
          tabBarIcon: ({ color, size }) => <Bookmark size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'כרטיסים',
          tabBarIcon: ({ color, size }) => <Ticket size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'פרופיל',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

// NativeWind migration complete - styles object removed
