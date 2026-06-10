import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  I18nManager,
  ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Magnetometer, Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withRepeat,
  withSequence,
  cancelAnimation,
  Easing
} from 'react-native-reanimated';
import { 
  X, 
  Compass, 
  Navigation, 
  MapPin, 
  Sparkles, 
  Coffee, 
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Info
} from 'lucide-react-native';
import { Colors } from '../../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Waypoint {
  name: string;
  type: 'entrance' | 'snacks' | 'hall' | 'restroom';
  x: number;
  y: number;
  z: number;
  bearingAngle: number;
  description: string;
}

export default function ARWayfindingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { branchId = 'glilot' } = useLocalSearchParams<{ branchId?: string }>();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [heading, setHeading] = useState(0);
  
  // Simulated location tracking
  const [distance, setDistance] = useState(15); // simulated distance in meters
  const [showUpsell, setShowUpsell] = useState(false);
  const [arMarkerVisible, setArMarkerVisible] = useState(false);

  // Shared values for Reanimated 3D rotations & springs
  const arrowRotation = useSharedValue(0);
  const compassRotation = useSharedValue(0);
  const upsellTranslateY = useSharedValue(300);
  const markerScale = useSharedValue(0);
  const markerOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  // Immersive HUD animations
  const reticleScale = useSharedValue(1.2);
  const reticleRotate = useSharedValue(0);
  const reticleOpacity = useSharedValue(0.4);
  const lidarY = useSharedValue(0);
  const accelX = useSharedValue(0);
  const accelY = useSharedValue(0);

  // Sensor subscription refs
  const subscriptionRef = useRef<any>(null);
  const accelSubscriptionRef = useRef<any>(null);

  // 1. Fetch layout waypoints
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`https://movie-app-server-olet.onrender.com/api/cinema/layouts/${branchId}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        if (!isMounted) return;
        if (data && data.waypoints) {
          setWaypoints(data.waypoints);
          // Default to first waypoint (typically entrance or snacks)
          const snacksWp = data.waypoints.find((w: any) => w.type === 'snacks');
          setSelectedWaypoint(snacksWp || data.waypoints[0]);
        }
        setLoading(false);
      })
      .catch(() => {
        // Fallback static seed if offline/error
        if (!isMounted) return;
        const mockWaypoints: Waypoint[] = [
          {
            name: 'כניסה ראשית',
            type: 'entrance',
            x: 0,
            y: 0,
            z: 1,
            bearingAngle: 0,
            description: 'ברוכים הבאים לסינבוק גלילות. התחילו את הניווט כאן.',
          },
          {
            name: 'מזנון חטיפים קולנועי',
            type: 'snacks',
            x: 12,
            y: 18,
            z: 1,
            bearingAngle: 45,
            description: 'מזנון הפופקורן והשתייה. אל תפספסו את מבצעי הבזק!',
          },
          {
            name: 'אולם IMAX (אולם 2)',
            type: 'hall',
            x: -15,
            y: 32,
            z: 1,
            bearingAngle: 315,
            description: 'כניסה לאולם הקרנה מספר 2 (חוויית IMAX סוחפת).',
          },
          {
            name: 'שירותי אורחים',
            type: 'restroom',
            x: 6,
            y: -12,
            z: 1,
            bearingAngle: 180,
            description: 'שירותים ממוקמים משמאל למסדרון הראשי.',
          },
        ];
        setWaypoints(mockWaypoints);
        setSelectedWaypoint(mockWaypoints[1]);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [branchId]);

  // 2. Camera permission request
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  // 3. Sensor listeners & background sweeps
  useEffect(() => {
    Magnetometer.setUpdateInterval(100);
    subscriptionRef.current = Magnetometer.addListener((data) => {
      let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
      angle = (angle + 360) % 360;
      setHeading(angle);
    });

    Accelerometer.setUpdateInterval(50);
    accelSubscriptionRef.current = Accelerometer.addListener((data) => {
      accelX.value = withSpring(-data.x * 20, { damping: 15, stiffness: 100 });
      accelY.value = withSpring(data.y * 20, { damping: 15, stiffness: 100 });
    });

    // LiDAR horizontal sweep line
    lidarY.value = withRepeat(
      withTiming(SCREEN_HEIGHT, { duration: 3200, easing: Easing.linear }),
      -1,
      false
    );

    // Pulse animation for directional alignment indicator
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800 }),
        withTiming(1.0, { duration: 800 })
      ),
      -1,
      true
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
      if (accelSubscriptionRef.current) {
        accelSubscriptionRef.current.remove();
      }
      cancelAnimation(pulseScale);
      cancelAnimation(lidarY);
    };
  }, []);

  // 4. Handle navigation math, distance simulator, and overlays
  useEffect(() => {
    if (!selectedWaypoint) return;

    const relative = (selectedWaypoint.bearingAngle - heading + 360) % 360;
    
    compassRotation.value = withTiming(-heading, { duration: 100 });
    arrowRotation.value = withTiming(relative, { duration: 100 });

    const isPointingAt = relative < 25 || relative > 335;
    if (isPointingAt && !arMarkerVisible) {
      setArMarkerVisible(true);
      markerScale.value = withSpring(1, { damping: 12 });
      markerOpacity.value = withTiming(1, { duration: 200 });

      // Tighten reticle and spin
      reticleScale.value = withSpring(0.7, { damping: 12, stiffness: 90 });
      reticleRotate.value = withTiming(360, { duration: 1500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
      reticleOpacity.value = withTiming(1, { duration: 300 });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } else if (!isPointingAt && arMarkerVisible) {
      setArMarkerVisible(false);
      markerScale.value = withTiming(0, { duration: 200 });
      markerOpacity.value = withTiming(0, { duration: 200 });

      // Loosen reticle
      reticleScale.value = withSpring(1.2, { damping: 12 });
      reticleRotate.value = withTiming(0, { duration: 500 });
      reticleOpacity.value = withTiming(0.4, { duration: 300 });
    }

    if (selectedWaypoint.type === 'snacks' && distance < 8) {
      if (!showUpsell) {
        setShowUpsell(true);
        upsellTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } else {
      if (showUpsell) {
        setShowUpsell(false);
        upsellTranslateY.value = withSpring(300, { damping: 15 });
      }
    }
  }, [heading, selectedWaypoint, distance]);

  // 5. Simulated distance walk loop
  useEffect(() => {
    if (!selectedWaypoint) return;

    setDistance(14 + Math.floor(Math.random() * 5));

    const interval = setInterval(() => {
      setDistance(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [selectedWaypoint]);

  // Reanimated style bindings
  const compassStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${compassRotation.value}deg` }],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${arrowRotation.value}deg` }],
  }));

  const markerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: markerScale.value }],
    opacity: markerOpacity.value,
  }));

  const upsellStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: upsellTranslateY.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedReticleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: reticleScale.value },
      { rotate: `${reticleRotate.value}deg` }
    ],
    opacity: reticleOpacity.value,
  }));

  const lidarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lidarY.value }],
  }));

  const levelDotStyle = useAnimatedStyle(() => {
    const isCentered = Math.abs(accelX.value) < 4 && Math.abs(accelY.value) < 4;
    return {
      transform: [
        { translateX: accelX.value },
        { translateY: accelY.value }
      ],
      backgroundColor: isCentered ? '#E5FF00' : '#00F2FF',
      shadowColor: isCentered ? '#E5FF00' : '#00F2FF',
    };
  });

  if (loading || !selectedWaypoint) {
    return (
      <View className="flex-1 bg-background justify-center items-center gap-4">
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="text-text font-assistant text-sm animate-pulse">מסתנכרן מול מתחם גלילות...</Text>
      </View>
    );
  }

  if (!permission || !permission.granted) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-8">
        <BlurView intensity={30} tint="dark" className="p-8 rounded-3xl border border-white/10 items-center bg-black/40 w-full">
          <Text className="text-white text-2xl font-bold font-rubik mb-4">דרושה גישה למצלמה</Text>
          <Text className="text-textSecondary text-sm text-center font-assistant mb-8">
            על מנת להשתמש בניווט מציאות רבודה (AR) להגעה קלה לאולם הקולנוע או למזנון, יש לאשר גישה למצלמת המכשיר.
          </Text>
          <TouchableOpacity 
            onPress={requestPermission}
            className="bg-primary py-4 px-8 rounded-2xl w-full items-center"
          >
            <Text className="text-white font-bold font-assistant text-base">אשר גישה</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* ─── LiDAR SCANNER SWEEP LINE ─── */}
      <Animated.View style={[styles.lidarLine, lidarStyle]}>
        <LinearGradient
          colors={['rgba(0, 242, 255, 0)', 'rgba(0, 242, 255, 0.45)', 'rgba(0, 242, 255, 0)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* ─── DYNAMIC TARGET-LOCKING RETICLE ─── */}
      <Animated.View style={[styles.reticleContainer, animatedReticleStyle]} pointerEvents="none">
        <View style={styles.bracketTL} />
        <View style={styles.bracketTR} />
        <View style={styles.bracketBL} />
        <View style={styles.bracketBR} />
        
        {/* Tiny Center Dot */}
        <View className="w-1.5 h-1.5 rounded-full bg-secondary/60" />
      </Animated.View>

      {/* Dynamic AR Perspective Marker Overlay */}
      <Animated.View 
        style={[
          styles.arMarkerContainer,
          markerStyle
        ]}
        pointerEvents="none"
      >
        <BlurView intensity={45} tint="dark" className="px-6 py-4 rounded-3xl border border-white/15 bg-black/35 flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-secondary/25 items-center justify-center border border-secondary/30">
            <MapPin size={20} color={Colors.secondary} />
          </View>
          <View style={{ alignItems: 'flex-start' }}>
            <Text className="text-white font-bold font-rubik text-base">{selectedWaypoint.name}</Text>
            <Text className="text-secondary font-semibold font-assistant text-xs">במרחק {distance} מטרים</Text>
          </View>
        </BlurView>
        {/* Pulsing indicator anchor dot */}
        <Animated.View style={[styles.pulseCircle, pulseStyle]} />
      </Animated.View>

      {/* Top Waypoint Selector tabs */}
      <View 
        style={{ 
          position: 'absolute', 
          top: insets.top + 16, 
          left: 16, 
          right: 16, 
          zIndex: 10 
        }}
      >
        <BlurView intensity={35} tint="dark" className="rounded-full border border-white/10 p-1 bg-black/45">
          <View 
            className="flex-row w-full justify-between items-center"
            style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}
          >
            {waypoints.map((wp) => {
              const isActive = selectedWaypoint.type === wp.type;
              let icon = <MapPin size={14} color={isActive ? Colors.background : 'white'} />;
              if (wp.type === 'snacks') icon = <Coffee size={14} color={isActive ? Colors.background : 'white'} />;
              if (wp.type === 'entrance') icon = I18nManager.isRTL ? <ArrowLeft size={14} color={isActive ? Colors.background : 'white'} /> : <ArrowRight size={14} color={isActive ? Colors.background : 'white'} />;

              return (
                <TouchableOpacity
                  key={wp.type}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedWaypoint(wp);
                  }}
                  className="px-4 py-2.5 rounded-full flex-row items-center gap-1.5"
                  style={isActive ? { backgroundColor: Colors.secondary } : {}}
                >
                  {icon}
                  <Text 
                    className={`font-semibold text-[10px] font-assistant ${isActive ? 'text-background' : 'text-white/70'}`}
                  >
                    {wp.type === 'entrance' ? 'כניסה' : wp.type === 'snacks' ? 'מזנון' : wp.type === 'hall' ? 'אולם' : 'שירותים'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>

      {/* Bottom Right Back Chevron Button */}
      <TouchableOpacity 
        onPress={() => router.back()}
        style={{ 
          position: 'absolute', 
          bottom: insets.bottom + 20, 
          start: 20, 
          zIndex: 20 
        }}
      >
        <BlurView intensity={40} tint="dark" className="w-12 h-12 rounded-full overflow-hidden border border-white/10 items-center justify-center bg-black/30">
          {I18nManager.isRTL ? <ChevronRight size={28} color="white" /> : <ChevronLeft size={28} color="white" />}
        </BlurView>
      </TouchableOpacity>

      {/* Gyro/Accelerometer-based Horizon Leveler */}
      <View 
        style={{ 
          position: 'absolute', 
          bottom: insets.bottom + 20, 
          end: 20, 
          zIndex: 20 
        }}
      >
        <BlurView intensity={40} tint="dark" className="w-12 h-12 rounded-full border border-white/10 items-center justify-center bg-black/30 overflow-hidden">
          <View style={{ position: 'absolute', width: '100%', height: 0.5, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
          <View style={{ position: 'absolute', height: '100%', width: 0.5, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
          <View style={{ position: 'absolute', width: 18, height: 18, borderRadius: 9, borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.15)' }} />
          <Animated.View style={[styles.levelDot, levelDotStyle]} />
        </BlurView>
      </View>

      {/* Center 3D HUD Navigation HUD */}
      <View style={styles.hudContainer} pointerEvents="none">
        {/* Rotating Compass Ring */}
        <Animated.View style={[styles.compassRing, compassStyle]}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} className="rounded-full" />
          <View style={styles.northMarker}>
            <Text className="text-secondary font-bold text-[10px]">N</Text>
          </View>
          <View style={styles.eastMarker}>
            <Text className="text-white/30 text-[8px]">E</Text>
          </View>
          <View style={styles.southMarker}>
            <Text className="text-white/30 text-[8px]">S</Text>
          </View>
          <View style={styles.westMarker}>
            <Text className="text-white/30 text-[8px]">W</Text>
          </View>
        </Animated.View>

        {/* Floating Rotating Navigation Arrow */}
        <Animated.View style={[styles.arrowContainer, arrowStyle]}>
          <Navigation size={48} color={Colors.secondary} fill={Colors.secondary} style={{ transform: [{ rotate: '45deg' }] }} />
        </Animated.View>

        {/* Waypoint Info Card */}
        <BlurView intensity={35} tint="dark" className="mt-8 px-6 py-4 rounded-3xl border border-white/10 bg-black/40 items-center max-w-[280px]">
          <Text className="text-white font-bold font-rubik text-sm mb-1">{selectedWaypoint.name}</Text>
          <Text className="text-textSecondary font-assistant text-xs text-center mb-2 leading-relaxed">
            {selectedWaypoint.description}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Compass size={14} color={Colors.secondary} />
            <Text className="text-secondary font-bold font-display text-base">
              {distance > 0 ? `${distance} מ׳` : 'הגעת ליעד!'}
            </Text>
          </View>
        </BlurView>
      </View>

      {/* Bottom Snack Bar Upsell Card */}
      <Animated.View 
        style={[
          styles.upsellContainer,
          upsellStyle
        ]}
        className="px-6 absolute w-full z-40"
      >
        <BlurView 
          intensity={50} 
          tint="dark" 
          className="p-6 rounded-[32px] border border-secondary/35 bg-[#121214]/85 shadow-2xl items-center"
          style={{
            shadowColor: Colors.secondary,
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
          }}
        >
          <View className="w-12 h-12 rounded-full bg-secondary/15 items-center justify-center mb-3">
            <Sparkles size={24} color={Colors.secondary} />
          </View>
          <Text className="text-white font-bold font-rubik text-lg text-center mb-1">🍿 הטבת בזק ליד המזנון! 🍿</Text>
          <Text className="text-secondary font-bold font-assistant text-sm text-center mb-3">רכישה מהירה ליד המזנון ללא המתנה בתור!</Text>
          <Text className="text-textSecondary font-assistant text-xs text-center mb-6 max-w-[260px] leading-relaxed">
            הזמן פופקורן ענק + נאצ'וס עם גבינה חמה ושתייה קרה ב-₪25 בלבד. המגש מחכה לך בעמדה המהירה.
          </Text>
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/movie/snacks');
            }}
            className="bg-secondary py-3.5 px-8 rounded-2xl w-full items-center shadow-lg"
          >
            <Text className="text-background font-bold font-assistant text-sm">הזמן עכשיו למזנון</Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  hudContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  compassRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  northMarker: {
    position: 'absolute',
    top: 8,
  },
  eastMarker: {
    position: 'absolute',
    right: 8,
  },
  southMarker: {
    position: 'absolute',
    bottom: 8,
  },
  westMarker: {
    position: 'absolute',
    left: 8,
  },
  arrowContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arMarkerContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.3,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 8,
  },
  pulseCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
    marginTop: 10,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  upsellContainer: {
    bottom: 40,
    alignSelf: 'center',
    width: '90%',
  },
  lidarLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 60,
    zIndex: 2,
  },
  reticleContainer: {
    position: 'absolute',
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    top: SCREEN_HEIGHT * 0.45 - 55,
    zIndex: 7,
  },
  bracketTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 22,
    height: 22,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#00F2FF',
  },
  bracketTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 22,
    height: 22,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#00F2FF',
  },
  bracketBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 22,
    height: 22,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#00F2FF',
  },
  bracketBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#00F2FF',
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
});
