import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Play, Pause, X, Headphones, Sparkles, RotateCcw } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { API_BASE_URL } from '@/constants/Config';

// Import our new modular components
import HapticVideoPlayer from '@/components/HapticVideoPlayer';
import NeonGlowOverlay from '@/components/NeonGlowOverlay';
import KineticContainer from '@/components/KineticContainer';
import WaveformVisualizer from '@/components/WaveformVisualizer';

// Import our services
import { SyncEngine, SyncEvent } from '@/services/SyncEngine';
import { useGyroscopePan } from '@/services/SensorService';
import hapticsService from '@/services/HapticsService';

export default function HapticPreviewScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore(state => state.token);
  const videoRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<SyncEvent[]>([]);
  const [lastBeatTime, setLastBeatTime] = useState<number>(0);
  const [lastBeatType, setLastBeatType] = useState<string>('');

  // Reanimated values for sync visual effects
  const glowIntensity = useSharedValue(0);
  const shakeIntensity = useSharedValue(0);

  // Hook for Gyroscope 3D drift and spatial balance control
  const { gyroX, gyroY, spatialPan } = useGyroscopePan();

  // Reference to the active SyncEngine
  const syncEngineRef = useRef<SyncEngine | null>(null);

  useEffect(() => {
    fetchHapticsTimeline();
  }, []);

  // Initialize and update SyncEngine when timeline is loaded
  useEffect(() => {
    if (timeline.length > 0) {
      const engine = new SyncEngine(timeline);
      engine.bindSharedValues(glowIntensity, shakeIntensity);
      engine.registerCallback((event) => {
        setLastBeatTime(event.timeMs);
        setLastBeatType(event.type);
      });
      syncEngineRef.current = engine;

      if (videoRef.current) {
        engine.bindVideo(videoRef.current);
      }

      if (isPlaying) {
        engine.start();
      }

      return () => {
        engine.stop();
      };
    }
  }, [timeline]);

  // Sync engine state tracking with play/pause
  useEffect(() => {
    if (syncEngineRef.current) {
      if (isPlaying) {
        syncEngineRef.current.start();
      } else {
        syncEngineRef.current.stop();
      }
    }
  }, [isPlaying]);

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
      // Client offline/simulation timeline fallback
      setTimeline([
        { timeMs: 2000, type: 'light' },
        { timeMs: 4500, type: 'medium' },
        { timeMs: 8000, type: 'heavy' },
        { timeMs: 12500, type: 'light' },
        { timeMs: 16000, type: 'heavy' },
        { timeMs: 20000, type: 'medium' },
        { timeMs: 25000, type: 'success' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;
    
    // Link video ref to engine
    if (videoRef.current && syncEngineRef.current) {
      syncEngineRef.current.bindVideo(videoRef.current);
    }

    // Reset triggered states when video loops
    if (status.didJustFinish && syncEngineRef.current) {
      syncEngineRef.current.reset();
    }
  };

  const togglePlayback = async () => {
    if (!videoRef.current) return;
    hapticsService.trigger('light');
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
    hapticsService.trigger('medium');
    await videoRef.current.replayAsync();
    if (syncEngineRef.current) {
      syncEngineRef.current.reset();
    }
    setIsPlaying(true);
  };

  const animatedPanStyle = useAnimatedStyle(() => {
    return {
      left: `${spatialPan.value * 100}%`
    };
  });

  return (
    <View style={styles.container}>
      
      {/* Neon Glow Overlay controlled by SyncEngine Shared Value */}
      <NeonGlowOverlay glowIntensity={glowIntensity} />

      {/* Kinetic Container for Screen Shake and Parallax Gyro drift */}
      <KineticContainer shakeIntensity={shakeIntensity} gyroX={gyroX} gyroY={gyroY}>
        {loading ? (
          <ActivityIndicator size="large" color="#E5FF00" style={styles.loader} />
        ) : (
          <HapticVideoPlayer
            videoRef={videoRef}
            sourceUri="https://assets.mixkit.co/videos/preview/mixkit-cinematic-foggy-forest-42512-large.mp4"
            isPlaying={isPlaying}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        )}
      </KineticContainer>

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

          {/* Spatial balance slider */}
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
        
        {/* Waveform Visualizer */}
        <WaveformVisualizer isPlaying={isPlaying} glowIntensity={glowIntensity} />

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
  loader: {
    flex: 1,
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
