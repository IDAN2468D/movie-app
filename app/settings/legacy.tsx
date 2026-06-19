import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  I18nManager,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, ChevronLeft, Award, Film, Clock, Ticket } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Line, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '@/constants/Theme';
import { Gyroscope } from '@/utils/SafeModules';
import {
  useLegacyData,
  useLegacyIsLoading,
  useLegacyError,
  useLegacyActions,
} from '@/store/useLegacyStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

// Dynamic SVG Radar chart configurations
const CENTER = 100;
const RADIUS = 75;
const ANGLE_STEP = (2 * Math.PI) / 5;
const GENRES = [
  { key: 'action', label: 'אקשן' },
  { key: 'comedy', label: 'קומדיה' },
  { key: 'sci-fi', label: 'מד"ב' },
  { key: 'horror', label: 'אימה' },
  { key: 'drama', label: 'דרמה' },
];

export default function LegacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const legacyData = useLegacyData();
  const isLoading = useLegacyIsLoading();
  const error = useLegacyError();
  const { fetchLegacy } = useLegacyActions();

  // Reanimated values for Gyroscope parallax
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    fetchLegacy();
  }, []);

  // Gyroscope effect hook
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let isMounted = true;

    const startGyro = async () => {
      try {
        const isAvailable = await Gyroscope.isAvailableAsync();
        if (!isAvailable || !isMounted) {
          // Fallback: floating idle animation
          tiltX.value = withRepeat(withTiming(16, { duration: 4000 }), -1, true);
          tiltY.value = withRepeat(withTiming(12, { duration: 5000 }), -1, true);
          return;
        }

        Gyroscope.setUpdateInterval(16);
        subscription = Gyroscope.addListener((data: { x: number; y: number }) => {
          if (isMounted) {
            tiltX.value = withSpring(data.y * 30, { damping: 22, stiffness: 90 });
            tiltY.value = withSpring(data.x * 30, { damping: 22, stiffness: 90 });
          }
        });
      } catch {
        if (isMounted) {
          tiltX.value = withRepeat(withTiming(16, { duration: 4000 }), -1, true);
          tiltY.value = withRepeat(withTiming(12, { duration: 5000 }), -1, true);
        }
      }
    };

    startGyro();

    return () => {
      isMounted = false;
      if (subscription) subscription.remove();
    };
  }, [tiltX, tiltY]);

  // Card perspective styling
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 600 },
        { rotateY: `${tiltX.value / 1.5}deg` },
        { rotateX: `${-tiltY.value / 1.5}deg` },
      ],
    };
  });

  // Glare sweeper styling
  const glareAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tiltX.value * 6 - 80 },
        { translateY: tiltY.value * 6 - 80 },
      ],
      opacity: Math.max(0.05, Math.min(0.3, 0.15 + (tiltX.value + tiltY.value) / 100)),
    };
  });

  // Background glowing blob movement
  const blobAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tiltX.value * 1.8 },
        { translateY: tiltY.value * 1.8 },
      ],
    };
  });

  // Calculate radar chart polygon points
  const getRadarPoints = () => {
    if (!legacyData) return '';
    const ratios = legacyData.genreRatios;

    return GENRES.map((g, index) => {
      const angle = index * ANGLE_STEP - Math.PI / 2;
      const ratio = ratios[g.key] !== undefined ? ratios[g.key] : 0.2;
      // Clamp ratio between 0.15 (minimum visual node) and 1
      const clampedRatio = Math.max(0.15, Math.min(1, ratio));
      const r = clampedRatio * RADIUS;
      const x = CENTER + r * Math.cos(angle);
      const y = CENTER + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  const radarPoints = getRadarPoints();

  // Get dynamic colors based on user's highest ratio
  const getThemeColors = () => {
    if (!legacyData) return { primary: Colors.primary, secondary: '#8B152A', glow: 'rgba(255,20,100,0.18)' };
    const ratios = legacyData.genreRatios;
    let maxGenre = 'drama';
    let maxRatio = -1;

    Object.keys(ratios).forEach((k) => {
      if (ratios[k] > maxRatio) {
        maxRatio = ratios[k];
        maxGenre = k;
      }
    });

    switch (maxGenre) {
      case 'action':
        return { primary: '#FF1464', secondary: '#FF8A00', glow: 'rgba(255,20,100,0.2)' };
      case 'comedy':
        return { primary: '#FFE500', secondary: '#00E5FF', glow: 'rgba(255,229,0,0.18)' };
      case 'sci-fi':
        return { primary: '#00FFFF', secondary: '#8B5CF6', glow: 'rgba(0,255,255,0.2)' };
      case 'horror':
        return { primary: '#D500F9', secondary: '#000000', glow: 'rgba(213,0,249,0.15)' };
      case 'drama':
      default:
        return { primary: Colors.primary, secondary: '#A05822', glow: 'rgba(255,20,100,0.18)' };
    }
  };

  const themeColors = getThemeColors();

  // Render axis line configs
  const axesLines = GENRES.map((g, index) => {
    const angle = index * ANGLE_STEP - Math.PI / 2;
    const x2 = CENTER + RADIUS * Math.cos(angle);
    const y2 = CENTER + RADIUS * Math.sin(angle);
    return { x2, y2 };
  });

  // Render concentric rings configs
  const ringsPolygons = [0.35, 0.7, 1.0].map((scale) => {
    return GENRES.map((g, index) => {
      const angle = index * ANGLE_STEP - Math.PI / 2;
      const r = scale * RADIUS;
      const x = CENTER + r * Math.cos(angle);
      const y = CENTER + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  });

  // Calculate coordinates for label placements
  const getLabelCoords = (index: number) => {
    const angle = index * ANGLE_STEP - Math.PI / 2;
    const offset = 16;
    const x = CENTER + (RADIUS + offset) * Math.cos(angle);
    const y = CENTER + (RADIUS + offset) * Math.sin(angle);
    return { x, y };
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#09090B' }}>
      {/* Background Gradients */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#130922', '#09090B', '#090710']}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Neon glow orbs */}
        <View
          style={{
            position: 'absolute',
            top: -100,
            left: -50,
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: themeColors.primary,
            opacity: 0.12,
            filter: 'blur(80px)',
          }}
        />
      </View>

      {/* Header */}
      <BlurView
        intensity={60}
        tint="dark"
        style={{
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.08)',
          zIndex: 10,
        }}
      >
        <View className="px-5 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/20 justify-center items-center"
          >
            {I18nManager.isRTL ? <ChevronRight color="white" size={24} /> : <ChevronLeft color="white" size={24} />}
          </Pressable>

          <Text style={[Typography.h3, { fontFamily: 'Rubik-Bold', color: 'white' }]}>
            מורשת קולנועית
          </Text>

          <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/10">
            <Award size={20} color={themeColors.primary} />
          </View>
        </View>
      </BlurView>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text className="text-white/60 font-body mt-4 text-[14px]" style={{ writingDirection: 'rtl' }}>
            מחשב את מורשת הקולנוע שלך...
          </Text>
        </View>
      ) : error || !legacyData ? (
        <View className="flex-1 justify-center items-center px-10">
          <Text className="text-red-400 text-center font-body text-base" style={{ writingDirection: 'rtl' }}>
            {error || 'לא נמצאו נתוני מורשת.'}
          </Text>
          <Pressable
            onPress={() => fetchLegacy()}
            className="mt-6 px-6 py-3 rounded-full bg-primary/20 border border-primary/40"
          >
            <Text className="text-white font-display">נסה שנית</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5 pt-6"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 40, 60) }}
          showsVerticalScrollIndicator={false}
        >
          {/* Generative Gyro-Reactive Glass Card */}
          <Animated.View entering={FadeInDown.duration(600).springify()}>
            <Animated.View
              style={[styles.cardContainer, { borderColor: themeColors.primary + '4D' }, cardAnimatedStyle]}
            >
            {/* Frosted Glass Base */}
            {Platform.OS !== 'web' ? (
              <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(18, 18, 20, 0.75)' }]} />
            )}

            {/* Glowing Backdrop Blob */}
            <Animated.View
              style={[
                styles.cardBlob,
                { backgroundColor: themeColors.glow },
                blobAnimatedStyle,
              ]}
            />

            {/* Glare Sweeper */}
            <Animated.View style={[styles.glare, glareAnimatedStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255, 255, 255, 0.12)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>

            {/* Card Content */}
            <View className="items-center py-6 px-4">
              <Award size={48} color={themeColors.primary} strokeWidth={1.5} />
              
              <Text
                style={[Typography.h2, { fontFamily: 'Rubik-Bold', color: '#FAFAF7', marginTop: 12 }]}
                className="text-center"
              >
                {legacyData.rankName}
              </Text>
              
              {/* Level Pill */}
              <LinearGradient
                colors={[themeColors.primary, themeColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="px-4 py-1.5 rounded-full mt-3 border border-white/10"
              >
                <Text
                  className="text-background font-bold text-xs"
                  style={{ fontFamily: 'Rubik-Bold' }}
                >
                  רמה {legacyData.legacyLevel}
                </Text>
              </LinearGradient>

              {/* Dynamic SVG Radar Chart */}
              <View className="mt-8 justify-center items-center">
                <Svg width="200" height="200">
                  {/* Outer Rings */}
                  {ringsPolygons.map((points, idx) => (
                    <Polygon
                      key={idx}
                      points={points}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="1.2"
                    />
                  ))}

                  {/* Axes lines */}
                  {axesLines.map((axis, idx) => (
                    <Line
                      key={idx}
                      x1={CENTER}
                      y1={CENTER}
                      x2={axis.x2}
                      y2={axis.y2}
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Ratios polygon shape */}
                  {radarPoints ? (
                    <Polygon
                      points={radarPoints}
                      fill={themeColors.primary + '33'}
                      stroke={themeColors.primary}
                      strokeWidth="2.2"
                    />
                  ) : null}

                  {/* Axis Text Labels */}
                  {GENRES.map((g, index) => {
                    const coords = getLabelCoords(index);
                    const isLeft = coords.x < CENTER;
                    return (
                      <SvgText
                        key={g.key}
                        x={coords.x}
                        y={coords.y + 4} // vertical adjustment
                        fill="rgba(255, 255, 255, 0.5)"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="Assistant-Bold"
                      >
                        {g.label}
                      </SvgText>
                    );
                  })}
                </Svg>
              </View>
            </View>
            </Animated.View>
          </Animated.View>

          {/* Detailed Statistics Section */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            className="mt-8 gap-4"
          >
            <Text
              style={{ fontFamily: 'Rubik-Bold', fontSize: 18, color: 'white', textAlign: 'right' }}
            >
              נתונים קולנועיים
            </Text>

            <View className="flex-row gap-4">
              {/* Stat Block 1 */}
              <View className="flex-1 bg-surfaceLight border border-white/5 rounded-3xl p-5 items-center">
                <Clock size={20} color={themeColors.primary} />
                <Text className="text-white/40 text-[11px] font-body mt-2">זמן צפייה</Text>
                <Text style={{ fontFamily: 'Anton-Regular', fontSize: 24, color: 'white', marginTop: 4 }}>
                  {legacyData.totalWatchTime}
                </Text>
                <Text className="text-white/40 text-[10px] font-body">דקות סה"כ</Text>
              </View>

              {/* Stat Block 2 */}
              <View className="flex-1 bg-surfaceLight border border-white/5 rounded-3xl p-5 items-center">
                <Film size={20} color={Colors.secondary} />
                <Text className="text-white/40 text-[11px] font-body mt-2">סרטים</Text>
                <Text style={{ fontFamily: 'Anton-Regular', fontSize: 24, color: 'white', marginTop: 4 }}>
                  {legacyData.totalTickets}
                </Text>
                <Text className="text-white/40 text-[10px] font-body">נרכשו בקופה</Text>
              </View>
            </View>
          </Animated.View>

          {/* Genre Distribution Bars */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            className="mt-8 bg-surfaceLight border border-white/5 rounded-[32px] p-6"
          >
            <Text
              style={{
                fontFamily: 'Rubik-Bold',
                fontSize: 16,
                color: 'white',
                textAlign: 'right',
                marginBottom: 20,
              }}
            >
              התפלגות העדפות
            </Text>

            <View className="gap-5">
              {GENRES.map((g) => {
                const ratio = legacyData.genreRatios[g.key] !== undefined ? legacyData.genreRatios[g.key] : 0.2;
                const percentage = Math.round(ratio * 100);

                return (
                  <View key={g.key} className="gap-2">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-white/60 font-body text-xs">{percentage}%</Text>
                      <Text className="text-white font-bold font-body text-[14px]">{g.label}</Text>
                    </View>
                    
                    {/* Progress Bar Container */}
                    <View className="h-2.5 bg-white/5 rounded-full overflow-hidden w-full">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: themeColors.primary,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    borderWidth: 1.5,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    overflow: 'hidden',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 8,
  },
  cardBlob: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: '60%',
    height: '60%',
    borderRadius: 999,
  },
  glare: {
    position: 'absolute',
    top: -120,
    bottom: -120,
    left: -60,
    width: 160,
    transform: [{ rotate: '25deg' }],
  },
});
