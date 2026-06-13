import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Gyroscope } from 'expo-sensors';
import { BlurView } from 'expo-blur';
import { X, Aperture, RefreshCw, Smartphone } from 'lucide-react-native';
import Svg, { Polygon, Circle, Text as SvgText, Line, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming 
} from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { useLegacyStore } from '@/store/useLegacyStore';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const CENTER_X = 150;
const CENTER_Y = 150;
const MAX_RADIUS = 100;
const GENRES = ['action', 'comedy', 'sci-fi', 'horror', 'drama'];
const GENRE_LABELS: Record<string, string> = {
  'action': 'אקשן ⚔️',
  'comedy': 'קומדיה 🎭',
  'sci-fi': 'מד"ב 🚀',
  'horror': 'אימה 💀',
  'drama': 'דרמה 🎬'
};

export default function CineLoomARScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  
  const legacyData = useLegacyStore(state => state.legacyData);
  const fetchLegacy = useLegacyStore(state => state.fetchLegacy);

  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [isAnchored, setIsAnchored] = useState(false);

  // Reanimated shared values for Hologram position and tilt
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const hologramScale = useSharedValue(0);
  const pulse = useSharedValue(0.85);

  useEffect(() => {
    fetchLegacy();
    
    // Request Camera permissions on mount
    if (!permission || !permission.granted) {
      requestPermission();
    }

    // Subscribe to Gyroscope
    const subscription = Gyroscope.addListener((data) => {
      setGyroData(data);
    });
    Gyroscope.setUpdateInterval(16); // 60Hz high rate

    // Animate entry scale
    hologramScale.value = withSpring(1.0, { damping: 15 });

    // Floating breathing effect for hologram
    pulse.value = withRepeat(
      withTiming(1.05, { duration: 1800 }),
      -1,
      true
    );

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Map gyroscope velocity to rotation angles dynamically
    // Filter noise: only accumulate if velocity > 0.05
    if (Math.abs(gyroData.x) > 0.05) {
      tiltX.value = withTiming(gyroData.x * -25, { duration: 150 });
    }
    if (Math.abs(gyroData.y) > 0.05) {
      tiltY.value = withTiming(gyroData.y * -25, { duration: 150 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gyroData]);

  const animatedHologramStyle = useAnimatedStyle(() => {
    const scaleFactor = hologramScale.value * pulse.value;
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${tiltX.value}deg` },
        { rotateY: `${tiltY.value}deg` },
        { scale: scaleFactor }
      ]
    };
  });

  const handleAnchorHologram = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsAnchored(prev => !prev);
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black justify-center items-center p-6">
        <Smartphone size={64} color="white" opacity={0.5} className="mb-4" />
        <Text className="text-h2 text-white font-display text-center mb-2">דרושה הרשאת מצלמה 📸</Text>
        <Text className="text-body text-white/60 text-center mb-8 font-sans">
          כדי להקרין את המורשת הקולנועית שלך בהולוגרמת AR תלת-מימדית, עלינו להשתמש במצלמת המכשיר.
        </Text>
        <Pressable 
          onPress={requestPermission}
          className="px-8 py-4 bg-primary rounded-2xl active:scale-95"
        >
          <Text className="text-white font-bold font-display text-h3">אפשר גישה למצלמה</Text>
        </Pressable>
      </View>
    );
  }

  // Fallback defaults for ratios
  const ratios = legacyData?.genreRatios || {
    'action': 0.2,
    'comedy': 0.2,
    'sci-fi': 0.2,
    'horror': 0.2,
    'drama': 0.2
  };

  // Helper to compute radar pentagon path points
  const getRadarPoints = (scale = 1.0, customizedRatios?: Record<string, number>) => {
    return GENRES.map((genre, idx) => {
      const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2; // Offset by 90 degrees to start at top
      const ratio = customizedRatios ? (customizedRatios[genre] || 0.2) : 1.0;
      const r = MAX_RADIUS * scale * ratio;
      const x = CENTER_X + Math.cos(angle) * r;
      const y = CENTER_Y + Math.sin(angle) * r;
      return `${x},${y}`;
    }).join(' ');
  };

  const activeRadarPoints = getRadarPoints(1.0, ratios);

  return (
    <View className="flex-1 bg-black">
      {/* Real camera view in the background */}
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* Absolute Dark HUD Mask Overlay */}
      <View className="absolute inset-0 bg-black/10" pointerEvents="none" />

      {/* Top HUD bar */}
      <View 
        className="absolute top-0 left-0 right-0 px-6 py-4 flex-row items-center justify-between z-20"
        style={{ paddingTop: insets.top }}
      >
        <Pressable 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-black/60 border border-white/10 justify-center items-center active:scale-90"
        >
          <X size={20} color="white" />
        </Pressable>

        <BlurView intensity={20} tint="dark" className="px-4 py-2 rounded-2xl border border-white/10 bg-black/30">
          <Text className="text-xs text-white font-display uppercase tracking-wider text-center">
            {isAnchored ? 'הולוגרמה נעולה 📍' : 'מחפש משטח ישר... 🌀'}
          </Text>
        </BlurView>

        <Pressable 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            fetchLegacy();
          }}
          className="w-10 h-10 rounded-full bg-black/60 border border-white/10 justify-center items-center active:scale-90"
        >
          <RefreshCw size={18} color="white" />
        </Pressable>
      </View>

      {/* Floating Holographic Radar Chart Pentagon */}
      <View className="flex-1 justify-center items-center">
        <Animated.View 
          style={[{ width: 300, height: 320, justifyContent: 'center', alignItems: 'center' }, animatedHologramStyle]}
        >
          {/* Hologram neon pillar base */}
          <View className="absolute bottom-0 w-36 h-[20px] bg-secondary/15 rounded-full border border-secondary/40 shadow-2xl opacity-60" style={{ transform: [{ scaleX: 2.0 }] }} />

          <Svg width={300} height={300} viewBox="0 0 300 300">
            <Defs>
              <LinearGradient id="hologramGridGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#00E5FF" stopOpacity="0.1" />
                <Stop offset="100%" stopColor="transparent" stopOpacity="0.0" />
              </LinearGradient>
              <LinearGradient id="hologramFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#00E5FF" stopOpacity="0.5" />
                <Stop offset="100%" stopColor={Colors.secondary} stopOpacity="0.2" />
              </LinearGradient>
            </Defs>

            {/* Radar concentric pentagons grid */}
            <Polygon points={getRadarPoints(1.0)} fill="url(#hologramGridGrad)" stroke="rgba(0, 229, 255, 0.2)" strokeWidth={1} />
            <Polygon points={getRadarPoints(0.75)} fill="none" stroke="rgba(0, 229, 255, 0.15)" strokeWidth={0.8} />
            <Polygon points={getRadarPoints(0.5)} fill="none" stroke="rgba(0, 229, 255, 0.15)" strokeWidth={0.8} />
            <Polygon points={getRadarPoints(0.25)} fill="none" stroke="rgba(0, 229, 255, 0.1)" strokeWidth={0.5} />

            {/* Axis lines from center to corners */}
            {GENRES.map((_, idx) => {
              const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
              const x2 = CENTER_X + Math.cos(angle) * MAX_RADIUS;
              const y2 = CENTER_Y + Math.sin(angle) * MAX_RADIUS;
              return (
                <Line 
                  key={`axis-${idx}`} 
                  x1={CENTER_X} y1={CENTER_Y} 
                  x2={x2} y2={y2} 
                  stroke="rgba(0, 229, 255, 0.15)" 
                  strokeWidth={1} 
                />
              );
            })}

            {/* Active taste profile fill shape */}
            <Polygon 
              points={activeRadarPoints} 
              fill="url(#hologramFillGrad)" 
              stroke="#00E5FF" 
              strokeWidth={2.2} 
            />

            {/* Glowing dots at data vertices */}
            {GENRES.map((genre, idx) => {
              const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
              const ratio = ratios[genre] || 0.2;
              const r = MAX_RADIUS * ratio;
              const x = CENTER_X + Math.cos(angle) * r;
              const y = CENTER_Y + Math.sin(angle) * r;

              return (
                <G key={`dot-${idx}`}>
                  <Circle cx={x} cy={y} r={4} fill="#00E5FF" />
                  <Circle cx={x} cy={y} r={8} fill="none" stroke="#FFFFFF" strokeWidth={1} opacity={0.6} />
                </G>
              );
            })}

            {/* Corner Genre Labels in Hebrew */}
            {GENRES.map((genre, idx) => {
              const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
              // Push text slightly outwards from corner coordinates
              const x = CENTER_X + Math.cos(angle) * (MAX_RADIUS + 22);
              const y = CENTER_Y + Math.sin(angle) * (MAX_RADIUS + 12);
              
              const label = GENRE_LABELS[genre] || genre;

              return (
                <SvgText
                  key={`label-${idx}`}
                  x={x}
                  y={y}
                  fill="#FFFFFF"
                  fontSize={10}
                  fontWeight="bold"
                  fontFamily="Rubik"
                  textAnchor="middle"
                  opacity={0.9}
                >
                  {label}
                </SvgText>
              );
            })}
          </Svg>
        </Animated.View>
      </View>

      {/* Bottom AR HUD control bar */}
      <View 
        className="absolute bottom-0 left-0 right-0 px-6 py-6 items-center z-20"
        style={{ paddingBottom: Math.max(insets.bottom + 20, 32) }}
      >
        <Pressable 
          onPress={handleAnchorHologram}
          className="w-18 h-18 rounded-full bg-black/60 border border-white/10 items-center justify-center active:scale-95"
          style={{ width: 72, height: 72, borderColor: isAnchored ? Colors.secondary : 'rgba(255,255,255,0.2)' }}
        >
          <Aperture size={32} color={isAnchored ? Colors.secondary : 'white'} />
        </Pressable>
        <Text className="text-[10px] text-white/40 mt-2 font-label uppercase tracking-widest text-center">
          {isAnchored ? 'שחרר נעילה' : 'מקם הולוגרמה בחלל'}
        </Text>
      </View>
    </View>
  );
}
