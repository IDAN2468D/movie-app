/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { X } from 'lucide-react-native';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      {/* Header (Cinematic Glassmorphism) */}
      <View 
        style={{ paddingTop: insets.top + 10 }} 
        className="px-6 flex-row items-center mb-4 z-[100] bg-black/40 border-b border-white/5"
      >
        <Pressable 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10 active:bg-white/20"
          hitSlop={20}
        >
          <X color="white" size={22} strokeWidth={2.5} />
        </Pressable>
        <Text 
          className="text-white text-xl font-bold font-assistant text-left flex-1 ms-4"
          style={{ fontFamily: 'Rubik-Bold' }}
        >
          נתוני פלטפורמה
        </Text>
      </View>

      <AnalyticsDashboard />
    </View>
  );
}
