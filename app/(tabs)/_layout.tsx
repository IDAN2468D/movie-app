/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Tab Layout - 120Hz Liquid Glass 4.5 Bottom Navigation
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Home, Search, Ticket, User, Bookmark } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAcousticEngine } from '../../hooks/useAcousticEngine';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { playSpatialClick } = useAcousticEngine();

  const screenListeners = {
    tabPress: (e: any) => {
      playSpatialClick(e);
    },
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.45)',
        tabBarStyle: {
          backgroundColor: 'rgba(18, 18, 20, 0.75)',
          borderTopColor: 'rgba(255, 255, 255, 0.12)',
          borderTopWidth: 1,
          paddingTop: 8,
          position: 'absolute',
          elevation: 0,
          height: 68 + (insets.bottom > 0 ? insets.bottom : 20),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.4,
          fontFamily: 'Inter-Regular',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={screenListeners}
        options={{
          title: 'בית',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconWrapper : undefined}>
              <Home size={size} color={focused ? '#8B5CF6' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        listeners={screenListeners}
        options={{
          title: 'חיפוש',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconWrapper : undefined}>
              <Search size={size} color={focused ? '#8B5CF6' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="watchlist"
        listeners={screenListeners}
        options={{
          title: 'רשימה',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconWrapper : undefined}>
              <Bookmark size={size} color={focused ? '#8B5CF6' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        listeners={screenListeners}
        options={{
          title: 'כרטיסים',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconWrapper : undefined}>
              <Ticket size={size} color={focused ? '#8B5CF6' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={screenListeners}
        options={{
          title: 'פרופיל',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconWrapper : undefined}>
              <User size={size} color={focused ? '#8B5CF6' : color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconWrapper: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 5,
  },
});
