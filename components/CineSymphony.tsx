/**
 * CineSymphony — סימפוניה קולנועית
 * 
 * Premium ambient atmosphere engine that creates a cinematic mood
 * through synchronized haptic patterns and visual rhythm indicators.
 * 
 * Features:
 * - Genre-based haptic rhythm patterns (action=intense, drama=slow, comedy=playful)
 * - Visual equalizer bars that pulse with the rhythm
 * - Morphic phase integration (intensity increases near showtime)
 * - Floating controller with play/pause and genre indicator
 * - Hebrew-first RTL layout
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, Pressable, I18nManager, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  FadeIn,
  FadeInDown,
  FadeOut,
  Easing,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { getMovieTheme, type IMovieTheme } from '@/utils/movieTheme';
import { Colors } from '@/constants/Theme';
import {
  Music,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Waves,
  Flame,
  Heart,
  Sparkles,
  Zap,
  Ghost,
} from 'lucide-react-native';

// === Types ===

type GenreRhythm = 'action' | 'drama' | 'comedy' | 'sci-fi' | 'horror';

interface HapticPattern {
  /** Delay before each beat in ms */
  beats: number[];
  /** Intensity for each beat */
  intensities: Haptics.ImpactFeedbackStyle[];
  /** BPM for visual equalizer */
  bpm: number;
  /** Hebrew label */
  labelHe: string;
  /** Icon component */
  icon: any;
}

interface CineSymphonyProps {
  movieTitle?: string;
  genre?: string;
  isActive?: boolean;
  onToggle?: (active: boolean) => void;
  compact?: boolean;
}

// === Rhythm Patterns ===

const RHYTHM_PATTERNS: Record<GenreRhythm, HapticPattern> = {
  action: {
    beats: [200, 150, 200, 100, 300, 150, 200, 250],
    intensities: [
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Medium,
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Medium,
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Medium,
    ],
    bpm: 140,
    labelHe: 'פעימת אקשן',
    icon: Flame,
  },
  drama: {
    beats: [600, 400, 500, 600, 400, 500, 700, 500],
    intensities: [
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Medium,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Medium,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Medium,
      Haptics.ImpactFeedbackStyle.Light,
    ],
    bpm: 72,
    labelHe: 'נשימה דרמטית',
    icon: Heart,
  },
  comedy: {
    beats: [300, 200, 150, 300, 250, 200, 350, 200],
    intensities: [
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Medium,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Medium,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Light,
    ],
    bpm: 110,
    labelHe: 'קצב שמח',
    icon: Sparkles,
  },
  'sci-fi': {
    beats: [400, 300, 200, 500, 300, 200, 400, 350],
    intensities: [
      Haptics.ImpactFeedbackStyle.Medium,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Medium,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Medium,
      Haptics.ImpactFeedbackStyle.Light,
    ],
    bpm: 95,
    labelHe: 'תדר עתידני',
    icon: Zap,
  },
  horror: {
    beats: [800, 200, 1000, 150, 600, 300, 900, 200],
    intensities: [
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Heavy,
    ],
    bpm: 60,
    labelHe: 'דופק אימה',
    icon: Ghost,
  },
};

// === Equalizer Bar Component ===

function EqualizerBar({
  index,
  color,
  bpm,
  isPlaying,
  barCount,
}: {
  index: number;
  color: string;
  bpm: number;
  isPlaying: boolean;
  barCount: number;
}) {
  const height = useSharedValue(4);

  useEffect(() => {
    if (!isPlaying) {
      height.value = withTiming(4, { duration: 300 });
      return;
    }

    const beatDuration = 60000 / bpm;
    const minH = 4 + (index % 3) * 2;
    const maxH = 14 + (index % 4) * 6;
    const phaseDelay = (index / barCount) * beatDuration;

    height.value = withDelay(
      phaseDelay,
      withRepeat(
        withSequence(
          withTiming(maxH, {
            duration: beatDuration * 0.4,
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(minH, {
            duration: beatDuration * 0.6,
            easing: Easing.in(Easing.quad),
          })
        ),
        -1,
        false
      )
    );
  }, [isPlaying, bpm, index, barCount, height]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 3,
          borderRadius: 1.5,
          backgroundColor: color,
          marginHorizontal: 1,
        },
        barStyle,
      ]}
    />
  );
}

// === Waveform Visualizer ===

function WaveformVisualizer({
  isPlaying,
  theme,
  bpm,
}: {
  isPlaying: boolean;
  theme: IMovieTheme;
  bpm: number;
}) {
  const barCount = 16;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 36,
        paddingHorizontal: 4,
      }}
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <EqualizerBar
          key={`eq-${i}`}
          index={i}
          color={i % 3 === 0 ? theme.primaryColor : `${theme.secondaryColor}90`}
          bpm={bpm}
          isPlaying={isPlaying}
          barCount={barCount}
        />
      ))}
    </View>
  );
}

// === Main Component ===

const CineSymphony: React.FC<CineSymphonyProps> = ({
  movieTitle,
  genre,
  isActive: controlledActive,
  onToggle,
  compact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const hapticTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beatIndexRef = useRef(0);
  const isMountedRef = useRef(true);

  // Resolve theme
  const theme = getMovieTheme(movieTitle);
  const rhythmKey: GenreRhythm = theme.genre;
  const pattern = RHYTHM_PATTERNS[rhythmKey];
  const PatternIcon = pattern.icon;

  // Glow animation
  const glowPulse = useSharedValue(0.3);

  useEffect(() => {
    if (isPlaying) {
      glowPulse.value = withRepeat(
        withTiming(1, { duration: 60000 / pattern.bpm }),
        -1,
        true
      );
    } else {
      glowPulse.value = withTiming(0.3, { duration: 400 });
    }
  }, [isPlaying, pattern.bpm, glowPulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value * 0.4,
  }));

  // Border glow
  const borderGlow = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      glowPulse.value,
      [0.3, 1],
      ['rgba(255,255,255,0.1)', `${theme.primaryColor}60`]
    );
    return { borderColor };
  });

  // Scale on press
  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // === Haptic Engine ===

  const triggerBeat = useCallback(() => {
    if (!isMountedRef.current || !isPlaying) return;

    const idx = beatIndexRef.current % pattern.beats.length;
    const delay = pattern.beats[idx];
    const intensity = pattern.intensities[idx];

    Haptics.impactAsync(intensity);
    beatIndexRef.current += 1;

    hapticTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && isPlaying) {
        triggerBeat();
      }
    }, delay);
  }, [isPlaying, pattern]);

  useEffect(() => {
    if (isPlaying) {
      beatIndexRef.current = 0;
      triggerBeat();
    } else {
      if (hapticTimeoutRef.current) {
        clearTimeout(hapticTimeoutRef.current);
        hapticTimeoutRef.current = null;
      }
    }

    return () => {
      if (hapticTimeoutRef.current) {
        clearTimeout(hapticTimeoutRef.current);
        hapticTimeoutRef.current = null;
      }
    };
  }, [isPlaying, triggerBeat]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (hapticTimeoutRef.current) {
        clearTimeout(hapticTimeoutRef.current);
      }
    };
  }, []);

  // Handle external control
  useEffect(() => {
    if (controlledActive !== undefined) {
      setIsPlaying(controlledActive);
    }
  }, [controlledActive]);

  const handleToggle = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    onToggle?.(newState);

    buttonScale.value = withSequence(
      withSpring(0.85, { damping: 12, stiffness: 200 }),
      withSpring(1, { damping: 14, stiffness: 160 })
    );

    if (newState) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // === Compact Mode (inline toggle button) ===
  if (compact) {
    return (
      <Animated.View entering={FadeIn}>
        <Animated.View style={buttonStyle}>
          <Pressable
            onPress={handleToggle}
            style={{
              flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isPlaying ? `${theme.primaryColor}50` : 'rgba(255,255,255,0.1)',
              backgroundColor: isPlaying ? `${theme.primaryColor}15` : 'rgba(255,255,255,0.05)',
              overflow: 'hidden',
            }}
          >
            {isPlaying && (
              <LinearGradient
                colors={[`${theme.primaryColor}10`, `${theme.secondaryColor}08`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Music size={14} color={isPlaying ? theme.primaryColor : 'rgba(255,255,255,0.5)'} />
            <Text
              style={{
                color: isPlaying ? theme.primaryColor : 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontFamily: 'Rubik-Bold',
                writingDirection: 'rtl',
              }}
            >
              {isPlaying ? pattern.labelHe : 'סימפוניה'}
            </Text>
            {isPlaying && (
              <WaveformVisualizer
                isPlaying={isPlaying}
                theme={theme}
                bpm={pattern.bpm}
              />
            )}
          </Pressable>
        </Animated.View>
      </Animated.View>
    );
  }

  // === Full Mode (floating card) ===
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(120)}
    >
      <Animated.View style={[buttonStyle]}>
        <Pressable onPress={handleToggle}>
          <Animated.View
            style={[
              {
                borderRadius: 28,
                borderWidth: 1,
                overflow: 'hidden',
                paddingVertical: 16,
                paddingHorizontal: 20,
              },
              borderGlow,
            ]}
          >
            {/* Background gradient */}
            <LinearGradient
              colors={
                isPlaying
                  ? [`${theme.primaryColor}18`, `${theme.secondaryColor}10`, 'rgba(9,9,11,0.95)']
                  : ['rgba(20,20,25,0.95)', 'rgba(15,15,18,0.98)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Ambient glow */}
            {isPlaying && (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    top: -40,
                    alignSelf: 'center',
                    width: 200,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: theme.primaryColor,
                  },
                  glowStyle,
                ]}
              />
            )}

            {/* Content row */}
            <View
              style={{
                flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              {/* Play/Pause button */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: isPlaying ? theme.primaryColor : 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isPlaying ? `${theme.primaryColor}80` : 'rgba(255,255,255,0.1)',
                }}
              >
                {isPlaying ? (
                  <Pause size={18} color="white" />
                ) : (
                  <Play size={18} color="white" style={{ marginStart: 2 }} />
                )}
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <PatternIcon size={12} color={theme.primaryColor} />
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 14,
                      fontFamily: 'Rubik-Bold',
                      textAlign: 'right',
                      writingDirection: 'rtl',
                    }}
                  >
                    סימפוניה קולנועית
                  </Text>
                </View>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: 11,
                    fontFamily: 'Rubik-Regular',
                    textAlign: 'right',
                    writingDirection: 'rtl',
                  }}
                >
                  {isPlaying
                    ? `${pattern.labelHe} · ${pattern.bpm} BPM`
                    : 'הפעל אווירה הפטית קולנועית'}
                </Text>
              </View>

              {/* Waveform or volume icon */}
              {isPlaying ? (
                <WaveformVisualizer
                  isPlaying={isPlaying}
                  theme={theme}
                  bpm={pattern.bpm}
                />
              ) : (
                <Volume2 size={20} color="rgba(255,255,255,0.3)" />
              )}
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

export default CineSymphony;
