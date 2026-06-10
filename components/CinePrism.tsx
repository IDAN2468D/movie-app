import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, I18nManager, Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Compass } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { Gyroscope } from '@/utils/SafeModules';

interface CinePrismProps {
  backdropUrl?: string;
  movieTitle?: string;
  themeColors?: {
    primary: string;
    secondary: string;
  };
  isActive?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CinePrism({ 
  backdropUrl, 
  movieTitle = 'סרט', 
  themeColors = { primary: Colors.primary, secondary: Colors.secondary }, 
  isActive = true 
}: CinePrismProps) {
  
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    if (!isActive) {
      tiltX.value = withSpring(0);
      tiltY.value = withSpring(0);
      return;
    }

    let subscription: { remove: () => void } | null = null;
    let isMounted = true;

    const startGyro = async () => {
      try {
        const isAvailable = await Gyroscope.isAvailableAsync();
        if (!isAvailable || !isMounted) {
          // Fallback dynamic movement (floating idle animation)
          tiltX.value = withRepeat(
            withSequence(
              withTiming(15, { duration: 4000 }),
              withTiming(-15, { duration: 4000 })
            ),
            -1,
            true
          );
          tiltY.value = withRepeat(
            withSequence(
              withTiming(10, { duration: 5000 }),
              withTiming(-10, { duration: 5000 })
            ),
            -1,
            true
          );
          return;
        }

        Gyroscope.setUpdateInterval(16);
        subscription = Gyroscope.addListener((data: { x: number; y: number }) => {
          if (isMounted) {
            // Apply spring smoothing
            tiltX.value = withSpring(data.y * 30, { damping: 22, stiffness: 90 });
            tiltY.value = withSpring(data.x * 30, { damping: 22, stiffness: 90 });
          }
        });
      } catch {
        if (isMounted) {
          tiltX.value = withRepeat(
            withSequence(
              withTiming(15, { duration: 4000 }),
              withTiming(-15, { duration: 4000 })
            ),
            -1,
            true
          );
          tiltY.value = withRepeat(
            withSequence(
              withTiming(10, { duration: 5000 }),
              withTiming(-10, { duration: 5000 })
            ),
            -1,
            true
          );
        }
      }
    };

    startGyro();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isActive]);

  const isRTL = I18nManager.isRTL;
  const rtlMultiplier = isRTL ? -1 : 1;

  // 1. Background Layer (0.4x translation)
  const bgAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tiltX.value * 0.4 * rtlMultiplier },
        { translateY: tiltY.value * 0.4 },
        { scale: 1.1 } // scale slightly to hide edges when translating
      ]
    };
  });

  // 2. Middle Shard Layer (1.0x translation)
  const midAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tiltX.value * 1.0 * rtlMultiplier },
        { translateY: tiltY.value * 1.0 },
      ]
    };
  });

  // 3. Foreground Glare & Glass Plate (1.8x translation)
  const fgAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tiltX.value * 1.8 * rtlMultiplier },
        { translateY: tiltY.value * 1.8 },
      ]
    };
  });

  const glareAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tiltX.value * 5.0 * rtlMultiplier - 100 },
        { translateY: tiltY.value * 5.0 - 100 }
      ],
      opacity: interpolate(
        tiltX.value + tiltY.value,
        [-60, 60],
        [0.08, 0.4],
        Extrapolation.CLAMP
      )
    };
  });

  return (
    <View style={StyleSheet.absoluteFill} className="bg-black overflow-hidden">
      {/* Layer 1: Background Blur */}
      <Animated.View style={[StyleSheet.absoluteFill, bgAnimatedStyle]}>
        {backdropUrl ? (
          <Image
            source={{ uri: backdropUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={StyleSheet.absoluteFill} className="bg-surface" />
        )}
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Layer 2: Middle floating shards of colored glass */}
      <Animated.View style={[StyleSheet.absoluteFill, midAnimatedStyle]} pointerEvents="none">
        {/* Shard A */}
        <View 
          style={{
            position: 'absolute',
            top: '30%',
            start: '20%',
            width: 90,
            height: 90,
            borderRadius: 18,
            backgroundColor: `${themeColors.primary}25`,
            borderColor: `${themeColors.primary}45`,
            borderWidth: 1,
            transform: [{ rotate: '45deg' }]
          }}
        />

        {/* Shard B */}
        <View 
          style={{
            position: 'absolute',
            top: '50%',
            end: '15%',
            width: 130,
            height: 60,
            borderRadius: 30,
            backgroundColor: `${themeColors.secondary}20`,
            borderColor: `${themeColors.secondary}40`,
            borderWidth: 1.5,
            transform: [{ rotate: '-20deg' }]
          }}
        />

        {/* Shard C */}
        <View 
          style={{
            position: 'absolute',
            top: '20%',
            end: '25%',
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: 'rgba(0, 229, 255, 0.15)',
            borderColor: 'rgba(0, 229, 255, 0.35)',
            borderWidth: 1,
          }}
        />

        {/* Shard D */}
        <View 
          style={{
            position: 'absolute',
            bottom: '25%',
            start: '35%',
            width: 100,
            height: 100,
            borderRadius: 24,
            backgroundColor: `${themeColors.primary}15`,
            borderColor: `${themeColors.primary}35`,
            borderWidth: 1,
            transform: [{ rotate: '15deg' }]
          }}
        />
      </Animated.View>

      {/* Layer 3: Foreground Glass Plate & Reflective Glare */}
      <Animated.View style={[StyleSheet.absoluteFill, fgAnimatedStyle]} pointerEvents="none">
        {/* Glass Plate Border Overlay */}
        <View 
          style={{
            position: 'absolute',
            top: '15%',
            left: '10%',
            right: '10%',
            bottom: '15%',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: 32,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            overflow: 'hidden'
          }}
        >
          {/* Internal blur of the glass plate */}
          <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />

          {/* Sweeping Glare Overlay */}
          <Animated.View style={[styles.glare, glareAnimatedStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          
          {/* Subtle details printed on glass */}
          <View className="absolute bottom-6 start-6 flex-row-reverse items-center gap-2 opacity-40">
            <Sparkles size={12} color="white" />
            <Text className="text-[9px] text-white font-mono uppercase tracking-widest">
              CINEPRISM REFRACTOR v1.1
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Bottom ambient glow */}
      <LinearGradient
        colors={['transparent', 'rgba(9, 9, 11, 0.7)', '#09090B']}
        locations={[0, 0.5, 1]}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 180,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  glare: {
    position: 'absolute',
    top: -200,
    bottom: -200,
    left: -200,
    width: 400,
    transform: [{ rotate: '45deg' }],
  }
});
