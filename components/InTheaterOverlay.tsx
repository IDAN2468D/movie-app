/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ticket, Popcorn, Moon, X, Bell } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { usePremiumStore } from '@/store/usePremiumStore';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function InTheaterOverlay() {
  const insets = useSafeAreaInsets();
  const { isInTheaterMode, setInTheaterMode } = usePremiumStore();

  if (!isInTheaterMode) return null;

  return (
    <Animated.View 
      entering={FadeIn} 
      exiting={FadeOut}
      className="absolute inset-0 z-[1000] bg-[#0A0A0C]" // Solid background, not transparent
    >
      <View 
        className="flex-1 px-8 items-center justify-between"
        style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }}
      >
        {/* Status Header */}
        <View className="items-center">
          <Animated.View 
            entering={SlideInUp.delay(200)}
            className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center border border-primary/30 mb-6"
          >
            <Moon color={Colors.primary} size={40} />
          </Animated.View>
          <Text className="text-h1 text-white font-display text-center mb-2">מצב קולנוע פעיל</Text>
          <Text className="text-body text-white/60 text-center font-assistant">
            עמעמנו את הממשק והשתקנו התראות כדי שתוכלו ליהנות מהסרט בשקט.
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="w-full gap-4">
          <Text className="text-label text-white/40 uppercase tracking-widest mb-2 px-2 text-left font-assistant">גישה מהירה</Text>
          
          <Pressable 
            onPress={() => {
              setInTheaterMode(false);
              router.push('/tickets');
            }}
            className="flex-row items-center bg-white/10 h-20 rounded-3xl px-6 border border-white/10"
          >
            <View className="w-12 h-12 bg-secondary/20 rounded-2xl items-center justify-center me-4">
              <Ticket color={Colors.secondary} size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-label text-white font-bold text-left font-assistant">הכרטיסים שלי</Text>
              <Text className="text-caption text-white/40 text-left font-assistant">סרקו בכניסה או הציגו לסדרן</Text>
            </View>
          </Pressable>

          <Pressable 
            onPress={() => {
              setInTheaterMode(false);
              router.push('/movie/snacks');
            }}
            className="flex-row items-center bg-white/10 h-20 rounded-3xl px-6 border border-white/10"
          >
            <View className="w-12 h-12 bg-primary/20 rounded-2xl items-center justify-center me-4">
              <Popcorn color={Colors.primary} size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-label text-white font-bold text-left font-assistant">הזמנת נשנושים</Text>
              <Text className="text-caption text-white/40 text-left font-assistant">משלוח ישירות לכיסא שלך</Text>
            </View>
          </Pressable>

          <Pressable 
            onPress={() => {
              // Standard alert for help
              alert('קריאת עזרה נשלחה לצוות האולם. איש צוות יגיע אליך בקרוב.');
            }}
            className="flex-row items-center bg-white/10 h-20 rounded-3xl px-6 border border-white/10"
          >
            <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center me-4">
              <Bell color="white" size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-label text-white font-bold text-left font-assistant">עזרה באולם</Text>
              <Text className="text-caption text-white/40 text-left font-assistant">קריאה לעזרה או דיווח על בעיה</Text>
            </View>
          </Pressable>
        </View>

        {/* Exit Button */}
        <Pressable 
          onPress={() => setInTheaterMode(false)}
          className="flex-row items-center bg-white/5 border border-white/10 h-16 rounded-3xl px-10"
        >
          <X color="white" size={20} className="me-3" />
          <Text className="text-label text-white font-display">יציאה מהמצב</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
