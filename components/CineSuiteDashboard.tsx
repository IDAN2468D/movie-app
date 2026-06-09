import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Moon, Sparkles, ChevronLeft, Popcorn, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  FadeInDown
} from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { useLoyalty } from '@/hooks/useLoyalty';
import { usePremiumStore } from '@/store/usePremiumStore';
import { useBookingStore } from '@/store/useBookingStore';

export default function CineSuiteDashboard() {
  const { points, currentTier, nextTier, pointsRemaining, progressPercent } = useLoyalty();
  const { isInTheaterMode, toggleInTheaterMode } = usePremiumStore();
  const { myTickets, fetchMyTickets } = useBookingStore();

  useEffect(() => {
    fetchMyTickets();
  }, [fetchMyTickets]);

  const activePreSyncTicket = React.useMemo(() => {
    return myTickets.find(t => 
      t.deliveryMode === 'pre-sync' && 
      t.snacks && 
      t.snacks.length > 0 && 
      t.targetDeliveryTime && 
      new Date(t.targetDeliveryTime).getTime() > Date.now()
    );
  }, [myTickets]);

  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!activePreSyncTicket || !activePreSyncTicket.targetDeliveryTime) return;

    const targetTime = new Date(activePreSyncTicket.targetDeliveryTime).getTime();
    const startTime = new Date(activePreSyncTicket.bookingDate || Date.now()).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const totalDuration = targetTime - startTime;
      const elapsed = now - startTime;
      
      let currentProgress = totalDuration > 0 ? elapsed / totalDuration : 0;
      currentProgress = Math.max(0, Math.min(1, currentProgress));
      setProgress(currentProgress);

      const remaining = targetTime - now;
      if (remaining <= 0) {
        setTimeLeftStr('מוגש כעת! 🍿');
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeLeftStr(`הגשה בעוד ${minutes}:${seconds.toString().padStart(2, '0')} דק'`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activePreSyncTicket]);

  // Pulse animation for Active Theater Mode
  const pulseOpacity = useSharedValue(0.4);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isInTheaterMode) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000 }),
          withTiming(0.4, { duration: 1000 })
        ),
        -1,
        true
      );
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 0;
      pulseScale.value = 1;
    }
  }, [isInTheaterMode, pulseOpacity, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => {
    return {
      opacity: pulseOpacity.value,
      transform: [{ scale: pulseScale.value }],
    };
  });

  const handleCinePassPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/loyalty' as any);
  };

  const handleTheaterModePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleInTheaterMode();
  };

  const handleCineMatchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/cinematch' as any);
  };

  return (
    <View className="px-6 my-6 gap-4">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <Text 
            className="text-white text-lg font-bold text-left font-assistant"
            style={{ writingDirection: 'rtl', textAlign: 'right' }}
          >
            CineSuite — האזור האישי
          </Text>
        </View>
      </View>

      {/* Dynamic Snack Pre-Sync Progress Card */}
      {!!activePreSyncTicket && (
        <Animated.View 
          entering={FadeInDown.duration(600).springify()}
          className="rounded-[28px] overflow-hidden border border-secondary/35 shadow-lg shadow-secondary/15"
        >
          <BlurView intensity={35} tint="dark" className="p-5 bg-[#E5FF00]/5">
            <View className="flex-row justify-between items-start mb-3">
              <View className="items-start flex-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <Clock size={12} color={Colors.secondary} />
                  <Text className="text-secondary text-xs font-bold font-assistant">
                    משלוח חטיפים מתוזמן (Pre-Sync)
                  </Text>
                </View>
                <Text 
                  className="text-white text-lg font-bold font-assistant text-left"
                  numberOfLines={1}
                >
                  {activePreSyncTicket.movieTitle}
                </Text>
              </View>
              <View className="w-10 h-10 rounded-2xl bg-secondary/15 border border-secondary/25 items-center justify-center">
                <Popcorn size={20} color={Colors.secondary} />
              </View>
            </View>

            {/* Liquid-styled Progress bar */}
            <View className="h-4 w-full bg-white/10 rounded-full overflow-hidden mb-2 relative">
              <LinearGradient
                colors={['#E5FF00', '#1B9B53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ height: '100%', width: `${progress * 100}%`, borderRadius: 99 }}
              />
              {/* Liquid Wave Refraction Lines */}
              <View className="absolute inset-0 bg-white/5 opacity-40 flex-row items-center overflow-hidden">
                <View className="w-[150%] h-[300%] bg-white/10 opacity-30 rounded-full" style={{ position: 'absolute', top: '-100%', left: '-25%', transform: [{ rotate: '15deg' }] }} />
              </View>
            </View>

            <View className="flex-row justify-between items-center w-full mt-1">
              <Text className="text-white/45 text-[11px] font-medium font-assistant">מושב {activePreSyncTicket.seats[0]?.row}{activePreSyncTicket.seats[0]?.number}</Text>
              <Text className="text-secondary text-xs font-bold font-assistant">{timeLeftStr}</Text>
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* CinePass Loyalty Progress Card */}
      <Pressable 
        onPress={handleCinePassPress}
        className="rounded-[28px] overflow-hidden border border-white/10"
      >
        <BlurView intensity={30} tint="dark" className="p-5 bg-black/40">
          <View className="flex-row justify-between items-start mb-4">
            <View className="items-start flex-1">
              <View className="flex-row items-center gap-1.5 mb-1">
                <Text 
                  className="text-secondary text-xs font-bold font-assistant"
                  style={{ writingDirection: 'rtl' }}
                >
                  מועדון CinePass • {currentTier}
                </Text>
              </View>
              <Text 
                className="text-white text-3xl font-bold font-display"
                style={{ fontFamily: 'Rubik-Bold' }}
              >
                {points} <Text className="text-white/60 text-base font-normal">נקודות</Text>
              </Text>
            </View>
            <View className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
              <Trophy size={20} color={Colors.secondary} />
            </View>
          </View>

          {/* Progress bar */}
          <View className="mb-2 flex-row justify-between items-center" style={{ flexDirection: 'row-reverse' }}>
            <Text className="text-white/45 text-[11px] font-medium font-assistant">
              {currentTier}
            </Text>
            <Text className="text-white/80 text-[11px] font-bold font-assistant">
              {pointsRemaining > 0 ? `עוד ${pointsRemaining} נקודות ל${nextTier}` : 'הגעת לרמה מקסימלית!'}
            </Text>
          </View>
          
          <View className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-3">
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: '100%', width: `${progressPercent}%`, borderRadius: 99 }}
            />
          </View>

          <View className="flex-row items-center justify-end gap-1">
            <Text className="text-white/60 text-xs font-medium font-assistant">למימוש הטבות באזור האישי</Text>
            <ChevronLeft size={14} color="rgba(255, 255, 255, 0.6)" />
          </View>
        </BlurView>
      </Pressable>

      {/* Grid: Cinema Mode & CineMatch Quick Launcher */}
      <View className="flex-row gap-4">
        {/* Cinema Mode Card */}
        <Pressable 
          onPress={handleTheaterModePress}
          className="flex-1 rounded-3xl overflow-hidden border border-white/10"
        >
          <BlurView 
            intensity={30} 
            tint="dark" 
            className={`p-4 h-[120px] justify-between items-start ${isInTheaterMode ? 'bg-primary/5' : 'bg-black/40'}`}
          >
            {/* Animated Glow backplate */}
            {isInTheaterMode && (
              <Animated.View 
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: Colors.primary + '12', borderRadius: 24 },
                  pulseStyle
                ]}
              />
            )}

            <View className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 items-center justify-center relative">
              <Moon size={18} color={isInTheaterMode ? Colors.primary : 'rgba(255, 255, 255, 0.6)'} />
            </View>

            <View className="items-start w-full">
              <Text 
                className="text-white font-bold text-sm text-left font-assistant"
                style={{ writingDirection: 'rtl' }}
              >
                מצב קולנוע
              </Text>
              <Text 
                className={`text-[11px] font-assistant text-left mt-0.5 ${isInTheaterMode ? 'text-primary font-bold' : 'text-white/40'}`}
                style={{ writingDirection: 'rtl' }}
              >
                {isInTheaterMode ? 'פעיל כעת 🌙' : 'הפעלה באולם'}
              </Text>
            </View>
          </BlurView>
        </Pressable>

        {/* CineMatch Card */}
        <Pressable 
          onPress={handleCineMatchPress}
          className="flex-1 rounded-3xl overflow-hidden border border-white/10"
        >
          <BlurView intensity={30} tint="dark" className="p-4 h-[120px] justify-between items-start bg-black/40">
            <View className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
              <Sparkles size={18} color={Colors.primary} />
            </View>

            <View className="items-start w-full">
              <Text 
                className="text-white font-bold text-sm text-left font-assistant"
                style={{ writingDirection: 'rtl' }}
              >
                סיינמאץ' AI
              </Text>
              <Text 
                className="text-white/40 text-[11px] text-left font-assistant mt-0.5"
                style={{ writingDirection: 'rtl' }}
              >
                החליקו למציאת סרט
              </Text>
            </View>
          </BlurView>
        </Pressable>
      </View>
    </View>
  );
}
