import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { X, Map, Compass, Navigation, AlertCircle, ShoppingBag, Eye, EyeOff } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  runOnJS 
} from 'react-native-reanimated';
import Svg, { Path, Circle, Rect, G, Text as SvgText } from 'react-native-svg';
import { router } from 'expo-router';
import { Colors } from '@/constants/Theme';
import { useAuthStore } from '@/store/useAuthStore';
import { API_BASE_URL } from '@/constants/Config';

const { width, height } = Dimensions.get('window');

interface POI {
  name: string;
  type: 'hall' | 'buffet' | 'restrooms' | 'exit';
  distance: number;
  directionAngle: number; // in degrees relative to phone orientation
  x: number; // simulated screen X
  y: number; // simulated screen Y
}

export default function ARWayfinderScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore(state => state.token);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<'ar' | 'svg'>('ar');
  const [pois, setPois] = useState<POI[]>([
    { name: 'פופקורן ומזנון מהיר', type: 'buffet', distance: 4.5, directionAngle: 45, x: width * 0.7, y: height * 0.3 },
    { name: 'חדר שירותים מרכזי', type: 'restrooms', distance: 8.2, directionAngle: -30, x: width * 0.15, y: height * 0.4 },
    { name: 'אולם ההקרנה 4', type: 'hall', distance: 15.5, directionAngle: 10, x: width * 0.45, y: height * 0.25 },
    { name: 'יציאת חירום ראשית', type: 'exit', distance: 25.0, directionAngle: -70, x: width * 0.1, y: height * 0.6 }
  ]);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);

  // Bobbing animation for AR signs
  const bobbing = useSharedValue(0);
  const pathPulse = useSharedValue(0.4);

  useEffect(() => {
    bobbing.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
    pathPulse.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      true
    );

    requestPermissions();
    fetchVenuePois();
  }, []);

  const requestPermissions = async () => {
    const cameraStatus = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(cameraStatus.status === 'granted');

    const locationStatus = await Location.requestForegroundPermissionsAsync();
    setHasLocationPermission(locationStatus.status === 'granted');

    if (cameraStatus.status !== 'granted') {
      setViewMode('svg'); // Fallback immediately if camera is denied
    }
  };

  const fetchVenuePois = async () => {
    try {
      // Use standard active venue ID or mock
      const mockVenueId = '60c72b2f9b1d8a23d88b4999';
      const response = await fetch(`${API_BASE_URL}/mcp/wayfinder/map/${mockVenueId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data?.pois) {
          // Map to POI distances
          const mapped = json.data.pois.map((p: any) => ({
            name: p.name,
            type: p.type,
            distance: Math.sqrt(p.coordinates.x * p.coordinates.x + p.coordinates.y * p.coordinates.y).toFixed(1),
            directionAngle: Math.atan2(p.coordinates.y, p.coordinates.x) * (180 / Math.PI),
            // Simulated project placement
            x: width * (0.3 + Math.random() * 0.4),
            y: height * (0.2 + Math.random() * 0.4)
          }));
          setPois(mapped);
        }
      }
    } catch (err) {
      console.warn('Failed to load POIs from backend, using default layouts:', err);
    }
  };

  // Reanimated style for signs floating
  const animatedSignStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: bobbing.value * 12 }
      ]
    };
  });

  const animatedPathStyle = useAnimatedStyle(() => {
    return {
      opacity: pathPulse.value
    };
  });

  const handleSelectPoi = (poi: POI) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPoi(poi);
  };

  return (
    <View style={styles.container}>
      
      {/* ── AR VIEWFINDER MODE ── */}
      {viewMode === 'ar' && hasCameraPermission ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back">
          
          {/* AR Floating Signs Overlay */}
          {pois.map((poi, idx) => (
            <Animated.View 
              key={idx}
              style={[
                styles.arSignContainer, 
                { left: poi.x, top: poi.y },
                animatedSignStyle
              ]}
            >
              <Pressable onPress={() => handleSelectPoi(poi)}>
                <BlurView 
                  intensity={70} 
                  tint="dark" 
                  style={[
                    styles.arSign, 
                    selectedPoi?.name === poi.name && { borderColor: '#FF1464', borderWidth: 2 }
                  ]}
                >
                  <View style={[styles.poiBadgeIcon, { backgroundColor: getPoiColor(poi.type) }]} />
                  <View style={styles.poiSignTextContainer}>
                    <Text style={styles.poiNameText}>{poi.name}</Text>
                    <Text style={styles.poiDistanceText}>{poi.distance} מ׳</Text>
                  </View>
                </BlurView>
              </Pressable>
            </Animated.View>
          ))}

          {/* Glowing guiding arrows on the floor overlay (Simulated) */}
          <View style={styles.arOverlayPaths}>
            <Animated.View style={[styles.arFloorArrow, animatedPathStyle]}>
              <Navigation size={48} color="#FF1464" style={{ transform: [{ rotate: '0deg' }] }} />
            </Animated.View>
          </View>

        </CameraView>
      ) : (
        /* ── 2D SVG FLOOR MAP FALLBACK ── */
        <View style={[StyleSheet.absoluteFill, styles.svgBackground]}>
          <View style={styles.svgMapHeaderContainer}>
            <Text style={styles.svgTitleText}>מפה דו-ממדית אינטראקטיבית</Text>
            <Text style={styles.svgSubtitleText}>מוצג כחלופה עקב חוסר גישה למצלמה או בחירה ידנית</Text>
          </View>
          
          <View style={styles.svgMapWrapper}>
            <Svg width={width - 40} height={height * 0.5} viewBox="0 0 320 400">
              {/* Outer Walls */}
              <Rect x="10" y="10" width="300" height="380" rx="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
              
              {/* Entrance Gate */}
              <Path d="M 120,390 L 200,390" stroke="#FF1464" strokeWidth="4" />
              <SvgText x="160" y="380" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle" fontFamily="Assistant-Bold">כניסה ראשית</SvgText>

              {/* Lobby Columns / Assets */}
              <Rect x="40" y="320" width="30" height="30" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" />
              <Rect x="250" y="320" width="30" height="30" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" />

              {/* Buffet / Concession Stand */}
              <Rect x="200" y="180" width="90" height="60" rx="10" fill="rgba(0,240,255,0.05)" stroke="rgba(0,240,255,0.2)" strokeWidth="1.5" />
              <SvgText x="245" y="215" fill="#00F0FF" fontSize="12" textAnchor="middle" fontFamily="Assistant-Bold">מזנון פופקורן</SvgText>

              {/* Restrooms */}
              <Rect x="30" y="180" width="80" height="60" rx="10" fill="rgba(138,43,226,0.05)" stroke="rgba(138,43,226,0.2)" strokeWidth="1.5" />
              <SvgText x="70" y="215" fill="#8A2BE2" fontSize="12" textAnchor="middle" fontFamily="Assistant-Bold">חדר שירותים</SvgText>

              {/* Theater Entrance (Hall 4) */}
              <Rect x="90" y="40" width="140" height="70" rx="12" fill="rgba(229,255,0,0.05)" stroke="rgba(229,255,0,0.2)" strokeWidth="2" />
              <SvgText x="160" y="80" fill="#E5FF00" fontSize="14" textAnchor="middle" fontFamily="Assistant-Bold">אולם הקרנה 4</SvgText>

              {/* Guide Path - Glowing Neon Line */}
              <Path 
                d="M 160,390 L 160,280 Q 160,210 245,210 Q 245,210 160,280 L 160,110" 
                fill="none" 
                stroke="#FF1464" 
                strokeWidth="4" 
                strokeLinecap="round"
                strokeDasharray="6,4"
              />

              {/* Current Location Dot */}
              <Circle cx="160" cy="360" r="8" fill="#FF1464" />
              <Circle cx="160" cy="360" r="14" fill="none" stroke="#FF1464" strokeWidth="2" opacity="0.6" />
              
              {/* Target Location Star */}
              <Circle cx="160" cy="110" r="6" fill="#E5FF00" />
            </Svg>
          </View>
        </View>
      )}

      {/* ── TOP CONTROL PANEL overlay ── */}
      <View style={[styles.topPanel, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.circleButton} onPress={() => router.back()}>
          <X size={20} color="#FFF" />
        </Pressable>

        <View style={styles.titleBadge}>
          <Compass size={16} color="#FF1464" />
          <Text style={styles.titleBadgeText}>מכוון הניווט Wayfinder</Text>
        </View>

        {hasCameraPermission && (
          <Pressable 
            style={styles.circleButton} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewMode(viewMode === 'ar' ? 'svg' : 'ar');
            }}
          >
            {viewMode === 'ar' ? <Map size={20} color="#FFF" /> : <Eye size={20} color="#FFF" />}
          </Pressable>
        )}
      </View>

      {/* ── BOTTOM STATUS SHEET overlay ── */}
      <BlurView intensity={80} tint="dark" style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {selectedPoi ? (
          <View style={styles.statusContent}>
            <View style={styles.statusHeader}>
              <View style={[styles.badgeIndicator, { backgroundColor: getPoiColor(selectedPoi.type) }]} />
              <Text style={styles.poiTitleText}>{selectedPoi.name}</Text>
            </View>
            <Text style={styles.poiSubText}>
              מרחק נוכחי: {selectedPoi.distance} מטרים • המשך ישר ופנה לפי חצי ההכוונה הניאוניים.
            </Text>
            
            <View style={styles.actionRow}>
              <Pressable style={styles.navigationButton} onPress={() => setSelectedPoi(null)}>
                <Text style={styles.navigationButtonText}>נקה בחירה</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.statusContent}>
            <View style={styles.statusHeader}>
              <AlertCircle size={20} color="#FF1464" />
              <Text style={styles.poiTitleText}>ניווט קולנועי פעיל</Text>
            </View>
            <Text style={styles.poiSubText}>
              לחצו על כל שלט זכוכית במרחב ה-AR או בחרו יעד במפה למציאת הדרך המהירה ביותר.
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.poiQuickList}>
              {pois.map((poi, idx) => (
                <Pressable 
                  key={idx} 
                  style={styles.quickPoiCard}
                  onPress={() => handleSelectPoi(poi)}
                >
                  <View style={[styles.quickBadge, { backgroundColor: getPoiColor(poi.type) }]} />
                  <Text style={styles.quickPoiName}>{poi.name.split(' ')[0]}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </BlurView>

    </View>
  );
}

const getPoiColor = (type: string) => {
  switch (type) {
    case 'buffet': return '#00F0FF';
    case 'restrooms': return '#8A2BE2';
    case 'hall': return '#E5FF00';
    case 'exit': return '#FF3B30';
    default: return '#FFF';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 44,
    gap: 8,
  },
  titleBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Assistant-Bold',
  },
  arSignContainer: {
    position: 'absolute',
    width: 140,
    zIndex: 10,
  },
  arSign: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    gap: 8,
  },
  poiBadgeIcon: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  poiSignTextContainer: {
    flex: 1,
  },
  poiNameText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Assistant-Bold',
    textAlign: 'right',
  },
  poiDistanceText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontFamily: 'Outfit-Medium',
    textAlign: 'right',
  },
  arOverlayPaths: {
    position: 'absolute',
    bottom: 220,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  arFloorArrow: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    paddingTop: 24,
    overflow: 'hidden',
  },
  statusContent: {
    gap: 12,
  },
  statusHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  badgeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  poiTitleText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Assistant-Bold',
    textAlign: 'right',
  },
  poiSubText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: 'Assistant-Regular',
    textAlign: 'right',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  navigationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  navigationButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Assistant-Medium',
  },
  poiQuickList: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 10,
  },
  quickPoiCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  quickBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickPoiName: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Assistant-Medium',
  },
  svgBackground: {
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  svgMapHeaderContainer: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  svgTitleText: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'Assistant-Bold',
  },
  svgSubtitleText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontFamily: 'Assistant-Regular',
    textAlign: 'center',
  },
  svgMapWrapper: {
    borderRadius: 24,
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 10,
    overflow: 'hidden',
  }
});
