import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      {/* Header (LTR) */}
      <View style={{ paddingTop: insets.top + 10 }} className="px-6 flex-row items-center mb-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-white/10 p-2 rounded-full mr-4"
        >
          <ChevronRight color="white" size={24} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold font-assistant text-left flex-1">
          נתוני פלטפורמה
        </Text>
      </View>

      <AnalyticsDashboard />
    </View>
  );
}
