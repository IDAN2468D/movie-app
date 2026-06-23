import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatus } from '@/utils/safeExpoAv';
import { Gyroscope } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Play, Pause, X, Headphones, Sparkles, Volume2, Maximize, RotateCcw } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming 
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Colors } from '@/constants/Theme';
import { useAuthStore } from '@/store/useAuthStore';
import { API_BASE_URL } from '@/constants/Config';

const { width, height } = Dimensions.get('window');

interface HapticEvent {
  timeMs: number;
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning';
  triggered?: boolean;
}

export default function HapticPreviewScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore(state => state.token);
  const videoRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<HapticEvent[]>([]);
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [lastBeatTime, setLastBeatTime] = useState<number>(0);
  const [lastBeatType, setLastBeatType] = useState<string>('');

  // Reanimated values for screen shake / glow fallback
  const containerShake = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const spatialPan = useSharedValue(0.5); // 0.0 Left, 1.0 Right

  useEffect(() => {
    fetchHapticsTimeline();
    
    // Subscribe to gyroscope updates for spatial balance control
    Gyroscope.setUpdateInterval(100);
    const subscription = Gyroscope.addListener((data) => {
      setGyroData(data);
      // Map Y rotation (roll) to panning value
      const mappedPan = Math.max(0, Math.min(1, 0.5 + (data.y * 0.3)));
      spatialPan.value = withSpring(mappedPan, { damping: 15 });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const fetchHapticsTimeline = async () => {
    try {
      const mockMovieId = '60c72b2f9b1d8a23d88b4999';
      const response = await fetch(`${API_BASE_URL}/mcp/haptics/timeline/${mockMovieId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data?.hapticTimeline) {
          setTimeline(json.data.hapticTimeline);
        }
      }
    } catch (err) {
      console.warn('Failed fetching haptic timeline, using client simulation timeline:', err);
      // Client offline timeline simulation
      setTimeline([
        { timeMs: 2000, type: 'light' },
        { timeMs: 4000, type: 'medium' },
        { timeMs: 7000, type: 'heavy' },
        { timeMs: 11000, type: 'light' },
        { timeMs: 14500, type: 'heavy' },
        { timeMs: 18000, type: 'medium' },
        { timeMs: 23000, type: 'success' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    
    const currentMs = status.positionMillis;
    
    // Check if any timeline event needs to be fired
    timeline.forEach((event) => {
      if (!event.triggered && Math.abs(currentMs - event.timeMs) < 250) {
        event.triggered = true;
        triggerHapticBeat(event.type);
        setLastBeatTime(currentMs);
        setLastBeatType(event.type);
      }
    });

    // Reset triggered states when video loops
    if (status.didJustFinish) {
      setTimeline(prev => prev.map(e => ({ ...e, triggered: false })));
    }
  };

  const triggerHapticBeat = async (type: HapticEvent['type']) => {
    // 1. Shake/Glow Visual Feedback
    glowOpacity.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withTiming(0, { duration: 400 })
    );

    const shakeAmt = type === 'heavy' ? 18 : type === 'medium' ? 10 : 5;
    containerShake.value = withSequence(
      withTiming(shakeAmt, { duration: 50 }),
      withTiming(-shakeAmt, { duration: 50 }),
      withTiming(shakeAmt / 2, { duration: 50 }),
      withTiming(0, { duration: 100 })
    );

    // 2. Play physical haptic vibration
    try {
      if (type === 'light') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (type === 'medium') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (type === 'heavy') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (type === 'success') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'warning') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (e) {
      console.warn('Native haptics error:', e);
    }
  };

  const togglePlayback = async () => {
    if (!videoRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const restartVideo = async () => {
    if (!videoRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await videoRef.current.replayAsync();
    setTimeline(prev => prev.map(e => ({ ...e, triggered: false })));
    setIsPlaying(true);
  };

  // Reanimated style transforms
  const animatedVideoStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: containerShake.value }
      ]
    };
  });

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value
    };
  });

  const animatedPanStyle = useAnimatedStyle(() => {
    // left panning position from 0 to 100%
    return {
      left: `${spatialPan.value * 100}%`
    };
  });

  return (
    <View style={styles.container}>
      
      {/* Glow highlight fallback layer */}
      <Animated.View style={[styles.neonGlowOverlay, animatedGlowStyle]} />

      {/* Video Content */}
      <Animated.View style={[styles.videoContainer, animatedVideoStyle]}>
        {loading ? (
          <ActivityIndicator size="large" color="#E5FF00" />
        ) : (
          <Video
            ref={videoRef}
            source={{ uri: 'https://assets.mixkit.co/videos/preview/mixkit-cinematic-foggy-forest-42512-large.mp4' }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isPlaying}
            isLooping
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        )}
      </Animated.View>

      {/* ── TOP NAV BAR ── */}
      <View style={[styles.topPanel, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.circleButton} onPress={() => router.back()}>
          <X size={20} color="#FFF" />
        </Pressable>

        <View style={styles.titleBadge}>
          <Headphones size={16} color="#E5FF00" />
          <Text style={styles.titleBadgeText}>קדימון סנסורי רטטי</Text>
        </View>

        <Pressable style={styles.circleButton} onPress={restartVideo}>
          <RotateCcw size={20} color="#FFF" />
        </Pressable>
      </View>

      {/* ── SPATIAL AUDIO BALANCE HUD ── */}
      <View style={styles.hudWrapper}>
        <BlurView intensity={30} tint="dark" style={styles.hudCard}>
          <View style={styles.hudHeader}>
            <Headphones size={14} color="#E5FF00" />
            <Text style={styles.hudTitle}>איזון שמע מרחבי (ג׳יירו)</Text>
          </View>
          <Text style={styles.hudSub}>הטו את המכשיר ימינה/שמאלה להכוונת במת הסאונד</Text>

          {/* Spatial slider simulation */}
          <View style={styles.balanceTrack}>
            <Animated.View style={[styles.balanceIndicator, animatedPanStyle]} />
            <View style={styles.balanceTrackCenter} />
          </View>
          <View style={styles.balanceLabels}>
            <Text style={styles.balanceLabelText}>ימין</Text>
            <Text style={styles.balanceLabelText}>מרכז</Text>
            <Text style={styles.balanceLabelText}>שמאל</Text>
          </View>
        </BlurView>
      </View>

      {/* ── BOTTOM CONTROL SHEET ── */}
      <BlurView intensity={80} tint="dark" style={[styles.bottomControlSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        
        {/* Haptic Waveform Info */}
        <View style={styles.waveHeader}>
          <Sparkles size={16} color="#E5FF00" />
          <Text style={styles.waveTitleText}>פידבק מגע מסונכרן</Text>
        </View>
        
        <Text style={styles.waveDescText}>
          פעימת מגע אחרונה: {lastBeatType ? `${lastBeatType.toUpperCase()} (ב-${(lastBeatTime/1000).toFixed(1)} שניות)` : 'ממתין לפעימה...'}
        </Text>

        {/* Video Player Controls */}
        <View style={styles.controlsRow}>
          <Pressable style={styles.largeControlBtn} onPress={togglePlayback}>
            {isPlaying ? <Pause size={24} color="#000" /> : <Play size={24} color="#000" />}
          </Pressable>
        </View>
      </BlurView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  neonGlowOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(229, 255, 0, 0.12)',
    zIndex: 2,
    pointerEvents: 'none',
  },
  videoContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
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
  hudWrapper: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    zIndex: 50,
  },
  hudCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.4)',
    overflow: 'hidden',
    gap: 8,
  },
  hudHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  hudTitle: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Assistant-Bold',
    textAlign: 'right',
  },
  hudSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: 'Assistant-Regular',
    textAlign: 'right',
  },
  balanceTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 3,
    marginTop: 10,
    position: 'relative',
    justifyContent: 'center',
  },
  balanceIndicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5FF00',
    shadowColor: '#E5FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    marginLeft: -7,
  },
  balanceTrackCenter: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginLeft: -1,
  },
  balanceLabels: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  balanceLabelText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontFamily: 'Assistant-Medium',
  },
  bottomControlSheet: {
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
    gap: 12,
  },
  waveHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  waveTitleText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Assistant-Bold',
    textAlign: 'right',
  },
  waveDescText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: 'Assistant-Regular',
    textAlign: 'right',
    lineHeight: 18,
  },
  controlsRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  largeControlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5FF00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E5FF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  }
});
