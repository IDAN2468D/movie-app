import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming } from 'react-native-reanimated';
import { Sparkles, Flame, Crown } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';

interface CineBarVisualizerProps {
  selectedBase: string;
  seasoningLevel: number;
  toppingsCount: number;
}

export const CineBarVisualizer: React.FC<CineBarVisualizerProps> = ({
  selectedBase,
  seasoningLevel,
  toppingsCount,
}) => {
  const pulseGlow = useSharedValue(0.8);
  const plateScale = useSharedValue(1);

  React.useEffect(() => {
    pulseGlow.value = withRepeat(withTiming(1.15, { duration: 1600 }), -1, true);
  }, []);

  React.useEffect(() => {
    plateScale.value = 0.95;
    plateScale.value = withSpring(1.0, { damping: 10, stiffness: 120 });
  }, [selectedBase, seasoningLevel, toppingsCount]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseGlow.value }],
    opacity: 0.25 + (pulseGlow.value - 0.8) * 0.4,
  }));

  const plateAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: plateScale.value }],
  }));

  return (
    <View className="items-center justify-center my-4 h-[210px] relative">
      {/* Background Neon Halo Glow */}
      <Animated.View
        style={[
          styles.haloGlow,
          glowStyle,
          { backgroundColor: selectedBase.includes('תות') || selectedBase.includes('קוקטייל') ? '#FF1464' : '#E5FF00' },
        ]}
      />

      {/* Main VIP Plate / Glass Visualizer Container */}
      <Animated.View style={[styles.plateBox, plateAnimatedStyle]}>
        <View className="items-center justify-center relative w-full h-full">
          <Crown size={32} color={Colors.secondary} style={{ marginBottom: 6 }} />
          <Text style={{ textAlign: 'center', writingDirection: 'ltr' }} className="text-white text-lg font-bold font-display px-4">
            {selectedBase}
          </Text>
          <View className="flex-row items-center gap-2 mt-2">
            <View className="flex-row items-center gap-1 bg-primary/20 px-2.5 py-0.5 rounded-full border border-primary/30">
              <Flame size={10} color={Colors.primary} />
              <Text className="text-primary text-[10px] font-bold">תיבול {seasoningLevel}%</Text>
            </View>
            <View className="bg-secondary/20 px-2.5 py-0.5 rounded-full border border-secondary/30">
              <Text className="text-secondary text-[10px] font-bold">{toppingsCount} תוספות שף</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <View className="absolute top-2 right-12">
        <Sparkles size={20} color={Colors.secondary} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  haloGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  plateBox: {
    width: 220,
    height: 170,
    borderRadius: 36,
    backgroundColor: 'rgba(18, 18, 20, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
