import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Sliders, Sparkles, Film, Zap } from 'lucide-react-native';
import useAcousticEngine from '../hooks/useAcousticEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRACK_WIDTH = SCREEN_WIDTH - 40;

export default function CineVisionFilterScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const { playSpatialClick, playSubBass } = useAcousticEngine();

  const [preset, setPreset] = useState<'cyber' | 'noir' | 'matrix'>('cyber');
  const [cyberFilter, setCyberFilter] = useState(70);
  const [filmGrain, setFilmGrain] = useState(40);
  const [neonGlow, setNeonGlow] = useState(80);
  const overlayScale = useSharedValue(1);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

  const handleDialChange = (type: 'cyber' | 'grain' | 'glow', val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    playSpatialClick();
    if (type === 'cyber') {
      setCyberFilter(clamped);
      overlayScale.value = withSpring(0.95 + (clamped / 500));
    } else if (type === 'grain') setFilmGrain(clamped);
    else setNeonGlow(clamped);
  };

  const handlePresetSelect = (mode: 'cyber' | 'noir' | 'matrix') => {
    playSubBass();
    setPreset(mode);
    if (mode === 'cyber') { setCyberFilter(90); setNeonGlow(80); }
    else if (mode === 'noir') { setCyberFilter(20); setFilmGrain(90); setNeonGlow(30); }
    else { setCyberFilter(50); setNeonGlow(100); setFilmGrain(50); }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container} className="justify-center items-center px-6">
        <Text style={styles.title} className="mb-4">דרושה גישה למצלמה</Text>
        <Pressable onPress={requestPermission} className="bg-primary px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">אשר מצלמה</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'CineVision Studio', headerShown: false }} />

      <View style={styles.cameraContainer}>
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
        {preset === 'cyber' && <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FF1464', opacity: (cyberFilter / 100) * 0.25 }]} pointerEvents="none" />}
        {preset === 'noir' && <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: (filmGrain / 100) * 0.55 }]} pointerEvents="none" />}
        {preset === 'matrix' && <View style={[StyleSheet.absoluteFill, { backgroundColor: '#00FF66', opacity: (neonGlow / 100) * 0.25 }]} pointerEvents="none" />}

        <View style={styles.hudOverlay} pointerEvents="none">
          <View style={styles.viewfinderFrame} />
          <Text style={styles.hudTextLeft} className="font-mono">REC 4K • {preset.toUpperCase()}</Text>
          <Text style={styles.hudTextRight} className="font-mono">GLOW: {neonGlow}%</Text>
        </View>
      </View>

      <BlurView intensity={50} tint="dark" style={styles.controlPanel}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.panelTitle}>CineVision Face Studio 📸</Text>
          <Text style={styles.panelSubtitle}>כוונן את הפילטר הקולנועי בזמן אמת</Text>

          <View className="flex-row gap-2 mb-6">
            <Pressable onPress={() => handlePresetSelect('cyber')} style={[styles.presetBtn, preset === 'cyber' && styles.activeCyber]}>
              <Zap size={14} color={preset === 'cyber' ? '#FFF' : '#FF1464'} />
              <Text style={[styles.presetText, preset === 'cyber' && styles.activeText]}>סייבר ⚡</Text>
            </Pressable>

            <Pressable onPress={() => handlePresetSelect('noir')} style={[styles.presetBtn, preset === 'noir' && styles.activeNoir]}>
              <Film size={14} color={preset === 'noir' ? '#FFF' : '#9CA3AF'} />
              <Text style={[styles.presetText, preset === 'noir' && styles.activeText]}>פילם נואר 🎬</Text>
            </Pressable>

            <Pressable onPress={() => handlePresetSelect('matrix')} style={[styles.presetBtn, preset === 'matrix' && styles.activeMatrix]}>
              <Sparkles size={14} color={preset === 'matrix' ? '#FFF' : '#00FF66'} />
              <Text style={[styles.presetText, preset === 'matrix' && styles.activeText]}>מטריקס 🟢</Text>
            </Pressable>
          </View>

          {/* Smooth Continuous Gesture Slider 1 */}
          <View className="mb-5">
            <View style={styles.sliderHeader}>
              <View className="flex-row items-center gap-1.5"><Sparkles size={16} color="#FF1464" /><Text style={styles.sliderLabel}>מסנן סייבר</Text></View>
              <Text style={styles.sliderValue}>{cyberFilter}%</Text>
            </View>
            <View 
              style={styles.sliderTrack} 
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(e) => handleDialChange('cyber', Math.round((e.nativeEvent.locationX / TRACK_WIDTH) * 100))}
              onResponderMove={(e) => handleDialChange('cyber', Math.round((e.nativeEvent.locationX / TRACK_WIDTH) * 100))}
            >
              <View style={[styles.sliderFill, { width: `${cyberFilter}%`, backgroundColor: '#FF1464' }]} />
            </View>
          </View>

          {/* Smooth Continuous Gesture Slider 2 */}
          <View className="mb-5">
            <View style={styles.sliderHeader}>
              <View className="flex-row items-center gap-1.5"><Film size={16} color="#E5FF00" /><Text style={styles.sliderLabel}>גרעיניות סרט</Text></View>
              <Text style={styles.sliderValue}>{filmGrain}%</Text>
            </View>
            <View 
              style={styles.sliderTrack} 
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(e) => handleDialChange('grain', Math.round((e.nativeEvent.locationX / TRACK_WIDTH) * 100))}
              onResponderMove={(e) => handleDialChange('grain', Math.round((e.nativeEvent.locationX / TRACK_WIDTH) * 100))}
            >
              <View style={[styles.sliderFill, { width: `${filmGrain}%`, backgroundColor: '#E5FF00' }]} />
            </View>
          </View>

          {/* Smooth Continuous Gesture Slider 3 */}
          <View className="mb-8">
            <View style={styles.sliderHeader}>
              <View className="flex-row items-center gap-1.5"><Sliders size={16} color="#8A5CFF" /><Text style={styles.sliderLabel}>זוהר ניאון</Text></View>
              <Text style={styles.sliderValue}>{neonGlow}%</Text>
            </View>
            <View 
              style={styles.sliderTrack} 
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(e) => handleDialChange('glow', Math.round((e.nativeEvent.locationX / TRACK_WIDTH) * 100))}
              onResponderMove={(e) => handleDialChange('glow', Math.round((e.nativeEvent.locationX / TRACK_WIDTH) * 100))}
            >
              <View style={[styles.sliderFill, { width: `${neonGlow}%`, backgroundColor: '#8A5CFF' }]} />
            </View>
          </View>

          {/* Elevated Back Button with Liquid Glass styling */}
          <Pressable onPress={() => router.back()} className="bg-white/10 py-4 rounded-2xl items-center border border-white/20 active:scale-95 shadow-xl mb-4">
            <Text className="text-white font-bold text-base">חזרה</Text>
          </Pressable>
        </ScrollView>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  cameraContainer: { flex: 1, position: 'relative' },
  hudOverlay: { ...StyleSheet.absoluteFill },
  viewfinderFrame: { position: 'absolute', top: 40, left: 20, right: 20, bottom: 180, borderWidth: 2, borderColor: 'rgba(255, 20, 100, 0.4)', borderRadius: 20 },
  hudTextLeft: { position: 'absolute', top: 48, left: 28, color: '#FF1464', fontSize: 10, fontWeight: 'bold' },
  hudTextRight: { position: 'absolute', top: 48, right: 28, color: '#FF1464', fontSize: 10, fontWeight: 'bold' },
  controlPanel: { position: 'absolute', bottom: 12, left: 10, right: 10, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', overflow: 'hidden' },
  scrollContent: { padding: 20, paddingBottom: 24 },
  panelTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', textAlign: 'left', marginBottom: 4 },
  panelSubtitle: { color: '#9CA3AF', fontSize: 13, textAlign: 'left', marginBottom: 16 },
  presetBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  presetText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  activeText: { color: '#FFF' },
  activeCyber: { backgroundColor: '#FF1464', borderColor: '#FF1464' },
  activeNoir: { backgroundColor: '#374151', borderColor: '#4B5563' },
  activeMatrix: { backgroundColor: '#059669', borderColor: '#10B981' },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sliderLabel: { color: '#E5E7EB', fontSize: 13, fontWeight: '600', textAlign: 'left' },
  sliderValue: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  sliderTrack: { height: 16, width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.12)', borderRadius: 8, overflow: 'hidden' },
  sliderFill: { height: '100%', borderRadius: 8 },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
});
