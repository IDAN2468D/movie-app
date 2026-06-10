/**
 * MorphicTicketOverlay — כרטיס מורפי
 * 
 * A dynamic overlay that morphs the ticket's visual identity based on:
 * 1. Movie genre (color palette from movieTheme)
 * 2. Time until showtime (intensity ramps up as showtime approaches)
 * 
 * Features:
 * - Pulsing aurora rings that intensify near showtime
 * - Dynamic gradient shifts (cold → warm as time approaches)
 * - Particle shimmer effect
 * - Countdown indicator with Hebrew labels
 */
import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolateColor,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { getMovieTheme } from '@/utils/movieTheme';
import { Clock, Flame, Sparkles, Zap } from 'lucide-react-native';

interface MorphicTicketOverlayProps {
  movieTitle?: string;
  showtimeDate?: string; // ISO date string e.g. "2025-12-25"
  showtimeTime?: string; // e.g. "20:30"
  compact?: boolean;     // For use in TicketCard (smaller) vs TicketDetailModal (full)
}

type MorphPhase = 'dormant' | 'awakening' | 'imminent' | 'live';

function getMorphPhase(hoursUntil: number): MorphPhase {
  if (hoursUntil > 24) return 'dormant';
  if (hoursUntil > 2) return 'awakening';
  if (hoursUntil > 0) return 'imminent';
  return 'live';
}

function getPhaseConfig(phase: MorphPhase) {
  switch (phase) {
    case 'dormant':
      return {
        pulseSpeed: 6000,
        glowOpacity: 0.08,
        ringCount: 1,
        labelHe: 'ממתין',
        icon: Clock,
        particleCount: 3,
      };
    case 'awakening':
      return {
        pulseSpeed: 4000,
        glowOpacity: 0.15,
        ringCount: 2,
        labelHe: 'מתעורר',
        icon: Sparkles,
        particleCount: 5,
      };
    case 'imminent':
      return {
        pulseSpeed: 2000,
        glowOpacity: 0.28,
        ringCount: 3,
        labelHe: 'מתקרב!',
        icon: Flame,
        particleCount: 8,
      };
    case 'live':
      return {
        pulseSpeed: 1200,
        glowOpacity: 0.4,
        ringCount: 3,
        labelHe: 'עכשיו!',
        icon: Zap,
        particleCount: 12,
      };
  }
}

function getTimeUntilShowtime(date?: string, time?: string): number {
  if (!date || !time) return 999;
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const showDate = new Date(date);
    showDate.setHours(hours, minutes, 0, 0);
    const now = new Date();
    const diffMs = showDate.getTime() - now.getTime();
    return diffMs / (1000 * 60 * 60); // hours
  } catch {
    return 999;
  }
}

function formatCountdown(hoursUntil: number): string {
  if (hoursUntil <= 0) return 'עכשיו!';
  if (hoursUntil < 1) {
    const mins = Math.ceil(hoursUntil * 60);
    return `${mins} דקות`;
  }
  if (hoursUntil < 24) {
    const hrs = Math.floor(hoursUntil);
    const mins = Math.ceil((hoursUntil - hrs) * 60);
    return mins > 0 ? `${hrs} שעות ו-${mins} דקות` : `${hrs} שעות`;
  }
  const days = Math.floor(hoursUntil / 24);
  return `${days} ימים`;
}

// === Animated Sub-Components ===

function PulseRing({ 
  delay, 
  size, 
  color, 
  speed 
}: { 
  delay: number; 
  size: number; 
  color: string; 
  speed: number;
}) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.8, { duration: speed, easing: Easing.out(Easing.cubic) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration: speed, easing: Easing.out(Easing.cubic) }),
        -1,
        false
      )
    );
  }, [delay, speed, scale, opacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
        },
        ringStyle,
      ]}
    />
  );
}

function ShimmerParticle({
  index,
  color,
  areaWidth,
  areaHeight,
}: {
  index: number;
  color: string;
  areaWidth: number;
  areaHeight: number;
}) {
  const translateY = useSharedValue(areaHeight + 10);
  const translateX = useSharedValue((index / 12) * areaWidth);
  const particleOpacity = useSharedValue(0);
  const particleSize = 2 + (index % 3) * 1.5;

  useEffect(() => {
    const delay = index * 300 + Math.random() * 1000;
    const duration = 3000 + Math.random() * 2000;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-10, { duration, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );

    particleOpacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: duration * 0.3 }),
          withTiming(0, { duration: duration * 0.7 })
        ),
        -1,
        false
      )
    );
  }, [index, areaHeight, translateY, particleOpacity]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: particleOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: particleSize,
          height: particleSize,
          borderRadius: particleSize / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

// === Main Component ===

const MorphicTicketOverlay: React.FC<MorphicTicketOverlayProps> = ({
  movieTitle,
  showtimeDate,
  showtimeTime,
  compact = false,
}) => {
  const theme = getMovieTheme(movieTitle);
  const hoursUntil = getTimeUntilShowtime(showtimeDate, showtimeTime);
  const phase = getMorphPhase(hoursUntil);
  const config = getPhaseConfig(phase);

  // Gradient color morph animation
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    if (compact) return;
    colorProgress.value = withRepeat(
      withTiming(1, { duration: config.pulseSpeed * 2, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [config.pulseSpeed, colorProgress, compact]);

  const gradientOverlayStyle = useAnimatedStyle(() => {
    if (compact) {
      return {
        backgroundColor: `${theme.primaryColor}15`,
      };
    }
    const bgColor = interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      [`${theme.primaryColor}15`, `${theme.secondaryColor}20`, `${theme.primaryColor}15`]
    );
    return {
      backgroundColor: bgColor,
    };
  });

  // Ambient glow
  const glowPulse = useSharedValue(config.glowOpacity * 0.5);

  useEffect(() => {
    if (compact) return;
    glowPulse.value = withRepeat(
      withTiming(config.glowOpacity, { duration: config.pulseSpeed }),
      -1,
      true
    );
  }, [config.glowOpacity, config.pulseSpeed, glowPulse, compact]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: compact ? 0 : glowPulse.value,
  }));

  // Phase badge glow
  const badgePulse = useSharedValue(0.6);
  useEffect(() => {
    if (compact) return;
    badgePulse.value = withRepeat(
      withTiming(1, { duration: config.pulseSpeed / 2 }),
      -1,
      true
    );
  }, [config.pulseSpeed, badgePulse, compact]);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgePulse.value,
  }));

  const IconComponent = config.icon;
  const ringSize = compact ? 80 : 140;
  const overlayHeight = compact ? 140 : 200;

  const particles = useMemo(
    () => Array.from({ length: config.particleCount }, (_, i) => i),
    [config.particleCount]
  );

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      {/* Dynamic gradient wash */}
      <Animated.View style={[StyleSheet.absoluteFill, gradientOverlayStyle]} />

      {/* Ambient glow behind rings */}
      {!compact && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -50,
              alignSelf: 'center',
              width: ringSize * 2.5,
              height: ringSize * 2.5,
              borderRadius: ringSize * 1.25,
              backgroundColor: theme.primaryColor,
            },
            glowStyle,
          ]}
        />
      )}

      {/* Pulse rings */}
      {!compact && (
        <View style={{ position: 'absolute', top: 20, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
          {Array.from({ length: config.ringCount }).map((_, i) => (
            <PulseRing
              key={`ring-${i}`}
              delay={i * (config.pulseSpeed / config.ringCount)}
              size={ringSize + i * 30}
              color={i % 2 === 0 ? theme.primaryColor : theme.secondaryColor}
              speed={config.pulseSpeed}
            />
          ))}
        </View>
      )}

      {/* Shimmer particles */}
      {!compact && (
        <View style={[StyleSheet.absoluteFill]}>
          {particles.map((i) => (
            <ShimmerParticle
              key={`particle-${i}`}
              index={i}
              color={i % 2 === 0 ? theme.primaryColor : theme.secondaryColor}
              areaWidth={300}
              areaHeight={overlayHeight}
            />
          ))}
        </View>
      )}

      {/* Phase badge */}
      {!compact && (
        <View
          style={{
            position: 'absolute',
            top: 16,
            alignSelf: 'center',
            flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Animated.View
            style={[
              {
                flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: `${theme.primaryColor}40`,
                overflow: 'hidden',
              },
              badgeStyle,
            ]}
          >
            <LinearGradient
              colors={[`${theme.primaryColor}20`, `${theme.secondaryColor}15`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <IconComponent size={12} color={theme.primaryColor} />
            <Text
              style={{
                color: theme.primaryColor,
                fontSize: 11,
                fontFamily: 'Rubik-Bold',
                textAlign: 'right',
                writingDirection: 'rtl',
              }}
            >
              {config.labelHe}
            </Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 10,
                fontFamily: 'Rubik-Regular',
                writingDirection: 'rtl',
              }}
            >
              {formatCountdown(hoursUntil)}
            </Text>
          </Animated.View>
        </View>
      )}

      {/* Compact countdown strip */}
      {compact && hoursUntil <= 24 && hoursUntil > 0 && (
        <View
          style={{
            position: 'absolute',
            top: 8,
            end: 8,
            flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 12,
            backgroundColor: `${theme.primaryColor}30`,
            borderWidth: 1,
            borderColor: `${theme.primaryColor}40`,
          }}
        >
          <IconComponent size={10} color={theme.primaryColor} />
          <Text
            style={{
              color: theme.primaryColor,
              fontSize: 9,
              fontFamily: 'Rubik-Bold',
              writingDirection: 'rtl',
            }}
          >
            {config.labelHe}
          </Text>
        </View>
      )}
    </View>
  );
};

export default MorphicTicketOverlay;
