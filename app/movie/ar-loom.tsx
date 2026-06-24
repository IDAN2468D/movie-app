import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Gyroscope } from 'expo-sensors';
import { BlurView } from 'expo-blur';
import { X, Aperture, RefreshCw, Smartphone, Award, Film, Clock } from 'lucide-react-native';
import Svg, { Polygon, Circle, Line, G, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming,
  FadeIn,
  FadeInDown,
  FadeOut
} from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { useLegacyStore } from '@/store/useLegacyStore';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const CENTER_X = 150;
const CENTER_Y = 130;
const MAX_RADIUS = 85;
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

  const [isAnchored, setIsAnchored] = useState(false);

  // Reanimated shared values for Hologram position and tilt
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const hologramScale = useSharedValue(0);
  const pulse = useSharedValue(0.9);
  const scanLineY = useSharedValue(0.15);

  // Gyroscope tracking ref for isAnchored state to prevent capture closures
  const isAnchoredRef = useRef(false);
  useEffect(() => {
    isAnchoredRef.current = isAnchored;
  }, [isAnchored]);

  useEffect(() => {
    fetchLegacy();
    
    // Request Camera permissions on mount
    if (!permission || !permission.granted) {
      requestPermission();
    }

    // Animate entry scale
    hologramScale.value = withSpring(1.0, { damping: 15 });

    // Floating breathing effect for hologram
    pulse.value = withRepeat(
      withTiming(1.03, { duration: 2000 }),
      -1,
      true
    );

    // Laser scanline animation loop
    scanLineY.value = withRepeat(
      withTiming(0.85, { duration: 3200 }),
      -1,
      true
    );
  }, []);

  // Configure Gyroscope listener cleanly with springs and fallbacks
  useEffect(() => {
    let subscription: any = null;
    let isMounted = true;

    const startGyro = async () => {
      try {
        const isAvailable = await Gyroscope.isAvailableAsync();
        if (!isAvailable) {
          // Fallback: floating idle animation on simulator
          tiltX.value = withRepeat(withTiming(10, { duration: 3000 }), -1, true);
          tiltY.value = withRepeat(withTiming(8, { duration: 4000 }), -1, true);
          return;
        }

        Gyroscope.setUpdateInterval(16); // 60Hz update rate
        subscription = Gyroscope.addListener((data) => {
          if (isMounted) {
            if (!isAnchoredRef.current) {
              // Smoothly map pitch/roll velocity to tilt angles
              tiltX.value = withSpring(data.y * -25, { damping: 20, stiffness: 80 });
              tiltY.value = withSpring(data.x * -25, { damping: 20, stiffness: 80 });
            } else {
              // Smoothly return to center when locked
              tiltX.value = withSpring(0, { damping: 15 });
              tiltY.value = withSpring(0, { damping: 15 });
            }
          }
        });
      } catch (e) {
        // Fallback: floating idle animation on errors
        tiltX.value = withRepeat(withTiming(10, { duration: 3000 }), -1, true);
        tiltY.value = withRepeat(withTiming(8, { duration: 4000 }), -1, true);
      }
    };

    startGyro();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

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

  const scanLineStyle = useAnimatedStyle(() => {
    return {
      top: `${scanLineY.value * 100}%`,
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

      {/* Laser Scanline Effect */}
      <Animated.View 
        style={[{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: '#00E5FF',
          shadowColor: '#00E5FF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
          elevation: 5,
        }, scanLineStyle]}
      />

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

        <BlurView intensity={25} tint="dark" className="px-4 py-2 rounded-2xl border border-white/10 bg-black/30">
          <Text className="text-[10px] text-[#00E5FF] font-bold uppercase tracking-wider text-center" style={{ fontFamily: 'Rubik-Bold' }}>
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
          style={[{ width: 300, height: 360, justifyContent: 'center', alignItems: 'center' }, animatedHologramStyle]}
        >
          <Svg width={300} height={360} viewBox="0 0 300 360">
            <Defs>
              <LinearGradient id="hologramGridGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#00E5FF" stopOpacity="0.12" />
                <Stop offset="100%" stopColor="transparent" stopOpacity="0.0" />
              </LinearGradient>
              <LinearGradient id="hologramFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#00E5FF" stopOpacity="0.55" />
                <Stop offset="100%" stopColor={Colors.secondary} stopOpacity="0.25" />
              </LinearGradient>
              <LinearGradient id="hologramBeamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <Stop offset="0%" stopColor="#00E5FF" stopOpacity="0.4" />
                <Stop offset="15%" stopColor="#00E5FF" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
              </LinearGradient>
              <LinearGradient id="projectorBaseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#00E5FF" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="transparent" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Volumetric Holographic Projection Cone Beam */}
            <Polygon 
              points="150,335 65,130 235,130" 
              fill="url(#hologramBeamGrad)" 
              opacity={isAnchored ? 0.3 : 0.65} 
            />

            {/* Glowing Holographic Projector Base Platform */}
            <Ellipse 
              cx={150} 
              cy={335} 
              rx={70} 
              ry={14} 
              fill="url(#projectorBaseGrad)" 
              stroke="#00E5FF" 
              strokeWidth={1} 
              opacity={0.6} 
            />
            <Ellipse 
              cx={150} 
              cy={335} 
              rx={40} 
              ry={8} 
              fill="none" 
              stroke={Colors.secondary} 
              strokeWidth={1.5} 
              opacity={0.7} 
            />
            
            {/* Glowing Projector Lens Center */}
            <Circle cx={150} cy={335} r={8} fill="#00E5FF" opacity={0.9} />
            <Circle cx={150} cy={335} r={4} fill="#FFFFFF" opacity={0.95} />

            {/* Radar concentric pentagons grid */}
            <Polygon points={getRadarPoints(1.0)} fill="url(#hologramGridGrad)" stroke="rgba(0, 229, 255, 0.25)" strokeWidth={1} />
            <Polygon points={getRadarPoints(0.75)} fill="none" stroke="rgba(0, 229, 255, 0.18)" strokeWidth={0.8} />
            <Polygon points={getRadarPoints(0.5)} fill="none" stroke="rgba(0, 229, 255, 0.18)" strokeWidth={0.8} />
            <Polygon points={getRadarPoints(0.25)} fill="none" stroke="rgba(0, 229, 255, 0.12)" strokeWidth={0.5} />

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
                  stroke="rgba(0, 229, 255, 0.18)" 
                  strokeWidth={1} 
                />
              );
            })}

            {/* Active taste profile fill shape */}
            <Polygon 
              points={activeRadarPoints} 
              fill="url(#hologramFillGrad)" 
              stroke="#00E5FF" 
              strokeWidth={2.5} 
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
                  <Circle cx={x} cy={y} r={4.5} fill="#00E5FF" />
                  <Circle cx={x} cy={y} r={8.5} fill="none" stroke="#FFFFFF" strokeWidth={1.2} opacity={0.7} />
                </G>
              );
            })}
          </Svg>

          {/* Absolute native Text Labels - replaces SvgText to fix Unicode errors and emojis */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {GENRES.map((genre, idx) => {
              const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
              // Project text labels slightly outward from maximum radius (MAX_RADIUS = 85)
              const labelDistance = MAX_RADIUS + 34;
              const x = CENTER_X + Math.cos(angle) * labelDistance;
              const y = CENTER_Y + Math.sin(angle) * labelDistance;
              
              const label = GENRE_LABELS[genre] || genre;

              return (
                <View
                  key={`native-label-${idx}`}
                  style={{
                    position: 'absolute',
                    left: x - 55, // Center the label on the computed horizontal point
                    top: y - 10,  // Center vertically
                    width: 110,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text 
                    style={{
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontFamily: 'Rubik-Bold',
                      textAlign: 'center',
                      textShadowColor: 'rgba(0, 229, 255, 0.65)',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 6,
                    }}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>
      </View>

      {/* Sleek Glassmorphic Stats Overlay Card */}
      {legacyData && (
        <Animated.View 
          entering={FadeInDown.delay(300).duration(800)}
          className="absolute bottom-28 left-6 right-6 p-5 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md"
        >
          <View className="flex-row items-center justify-between mb-4" style={{ flexDirection: 'row-reverse' }}>
            <View className="flex-row items-center gap-2" style={{ flexDirection: 'row-reverse' }}>
              <Award size={18} color="#00E5FF" />
              <Text className="text-white font-bold text-body font-display">פרופיל מורשת קולנועית</Text>
            </View>
            <View className="px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30">
              <Text className="text-primary text-[10px] font-bold">רמה {legacyData.legacyLevel || 1}</Text>
            </View>
          </View>
          
          <View className="flex-row justify-around py-1 gap-2">
            <View className="items-center flex-1">
              <Film size={16} color="white" opacity={0.5} className="mb-1" />
              <Text className="text-[9px] text-white/50 font-body mb-0.5">סרטים וכרטיסים</Text>
              <Text className="text-white text-caption font-bold font-sans">{legacyData.totalTickets || 0} כרטיסים</Text>
            </View>
            
            <View className="w-[1px] bg-white/10" />
            
            <View className="items-center flex-1">
              <Clock size={16} color="white" opacity={0.5} className="mb-1" />
              <Text className="text-[9px] text-white/50 font-body mb-0.5">זמן מסך כולל</Text>
              <Text className="text-white text-caption font-bold font-sans">
                {Math.round((legacyData.totalWatchTime || 0) / 60)} שעות
              </Text>
            </View>

            <View className="w-[1px] bg-white/10" />
            
            <View className="items-center flex-1">
              <Award size={16} color="white" opacity={0.5} className="mb-1" />
              <Text className="text-[9px] text-white/50 font-body mb-0.5">תואר מועדון</Text>
              <Text className="text-secondary text-caption font-bold font-display">{legacyData.rankName || 'חבר'}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Bottom AR HUD control bar */}
      <View 
        className="absolute bottom-0 left-0 right-0 px-6 py-6 items-center z-20"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 28) }}
      >
        <Pressable 
          onPress={handleAnchorHologram}
          className="w-18 h-18 rounded-full bg-black/60 border border-white/10 items-center justify-center active:scale-95 shadow-2xl"
          style={{ 
            width: 68, 
            height: 68, 
            borderColor: isAnchored ? Colors.secondary : 'rgba(255,255,255,0.25)',
            shadowColor: isAnchored ? Colors.secondary : '#00E5FF',
            shadowOpacity: 0.35,
            shadowRadius: 12
          }}
        >
          <Aperture size={30} color={isAnchored ? Colors.secondary : '#00E5FF'} />
        </Pressable>
        <Text className="text-[9px] text-white/50 mt-2 font-label uppercase tracking-widest text-center" style={{ fontFamily: 'Rubik-Medium' }}>
          {isAnchored ? 'שחרר נעילת הולוגרמה' : 'קבע מיקום הולוגרמה בחלל'}
        </Text>
      </View>
    </View>
  );
}
