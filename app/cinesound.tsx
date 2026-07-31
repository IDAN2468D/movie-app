import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Switch, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Headphones, Volume2, Save, X, RotateCcw } from 'lucide-react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { playSpatialTone, playCenterSubBass } from '@/utils/SoundEffects';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { ZeroReflowTabs } from '@/components/ZeroReflowTabs';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { GyroSoundStage } from '@/components/cinesound/GyroSoundStage';

const { width } = Dimensions.get('window');

const MODE_TABS = [
  { id: 'atmos', label: 'Dolby Atmos' },
  { id: 'spatial', label: 'Spatial Stereo' },
  { id: 'dtsx', label: 'DTS:X' },
];

export default function CineSoundScreen() {
  const insets = useSafeAreaInsets();
  const [soundMode, setSoundMode] = useState<string>('atmos');
  const [gyroActive, setGyroActive] = useState(true);
  const [currentPan, setCurrentPan] = useState(0);
  const [bass, setBass] = useState(50);
  const [mid, setMid] = useState(60);
  const [treble, setTreble] = useState(70);

  const nodeX = useSharedValue(0);
  const nodeY = useSharedValue(0);

  useEffect(() => {
    let sub: any;
    if (gyroActive) {
      Accelerometer.setUpdateInterval(33);
      sub = Accelerometer.addListener((data) => {
        const clampedX = Math.max(-1, Math.min(1, data.x * 1.5));
        setCurrentPan(clampedX);
        nodeX.value = withSpring(clampedX * 120, { stiffness: 100, damping: 15 });
        nodeY.value = withSpring(-data.y * 120, { stiffness: 100, damping: 15 });
      });
    } else {
      nodeX.value = withSpring(0);
      nodeY.value = withSpring(0);
      setCurrentPan(0);
    }
    return () => { if (sub) sub.remove(); };
  }, [gyroActive]);

  const animatedNodeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: nodeX.value }, { translateY: nodeY.value }],
  }));

  const handleSave = () => {
    playCenterSubBass();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const renderSlider = (label: string, value: number, onChange: (val: number) => void) => (
    <View style={styles.sliderContainer} key={label}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderVal}>{value}%</Text>
        <Text style={styles.rightText}>{label}</Text>
      </View>
      <View style={styles.sliderTrack}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPressIn={(e) => {
            const calculated = Math.min(Math.max(Math.round((e.nativeEvent.locationX / (width - 48)) * 100), 0), 100);
            playSpatialTone(300 + calculated * 5, (calculated - 50) / 50);
            onChange(calculated);
          }}
        />
        <View style={[styles.sliderFill, { width: `${value}%` }]} />
      </View>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 50, paddingHorizontal: 20 }}>
        <View style={styles.topHeader}>
          <Pressable onPress={() => { playSpatialTone(500, -0.5); router.back(); }} style={styles.headerBtn}>
            <X size={22} color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>CineSound 4.0 Quantum</Text>
          <Pressable onPress={() => { playSpatialTone(500, -0.5); Haptics.selectionAsync(); setBass(50); setMid(60); setTreble(70); }} style={styles.headerBtn}>
            <RotateCcw size={20} color="white" />
          </Pressable>
        </View>

        <WaveformVisualizer isPlaying={true} />
        <GyroSoundStage panValue={currentPan} />

        <Animated.View entering={FadeInDown.duration(500)}>
          <LiquidGlassCard variant="deep" glow="quantum" specular style={{ marginVertical: 14 }}>
            <Text style={styles.rightTitle}>מיפוי סאונד מרחבי 120Hz & הראפטיקה</Text>
            <Pressable
              onPressIn={(e) => {
                const pan = (e.nativeEvent.locationX / (width - 60)) * 2 - 1;
                Haptics.selectionAsync();
                playSpatialTone(650, pan);
              }}
              style={styles.spatialMatrixBox}
            >
              <View style={styles.centerNode}><Headphones size={24} color="#8B5CF6" /></View>
              <Animated.View style={[styles.dynamicNode, animatedNodeStyle]}><Volume2 size={16} color="#10B981" /></Animated.View>
            </Pressable>
          </LiquidGlassCard>
        </Animated.View>

        <View style={{ marginBottom: 16 }}>
          <ZeroReflowTabs tabs={MODE_TABS} activeTabId={soundMode} onTabSelect={setSoundMode} />
        </View>

        <LiquidGlassCard variant="deep" specular style={{ marginBottom: 16 }}>
          <View style={styles.switchRow}>
            <Switch value={gyroActive} onValueChange={(val) => { playSpatialTone(440, 0); setGyroActive(val); }} trackColor={{ false: '#3f3f46', true: '#8B5CF6' }} thumbColor="white" />
            <Text style={styles.rightTitle}>סנכרון תנועה מרחבי 120Hz</Text>
          </View>
          <View style={{ paddingTop: 12 }}>
            {renderSlider('בס (40Hz Sub-Bass)', bass, setBass)}
            {renderSlider('מיד (1kHz Mids)', mid, setMid)}
            {renderSlider('טרבל (12kHz Treble)', treble, setTreble)}
          </View>
        </LiquidGlassCard>

        <Pressable onPress={handleSave} style={styles.saveBtn}>
          <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.saveGradient}>
            <Save size={20} color="white" />
            <Text style={styles.saveBtnText}>שמור פרופיל מרחבי למושב</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#09090B' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  headerBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.06)', justifyContent: 'center', alignItems: 'center' },
  rightTitle: { color: '#FFF', fontSize: 15, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
  spatialMatrixBox: { width: '100%', height: 160, borderRadius: 80, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginVertical: 12, position: 'relative' },
  centerNode: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(139,92,246,0.2)', borderWidth: 1, borderColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center' },
  dynamicNode: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(16,185,129,0.3)', borderWidth: 1.5, borderColor: '#10B981', justifyContent: 'center', alignItems: 'center', position: 'absolute' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  sliderContainer: { marginBottom: 12 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sliderVal: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  sliderTrack: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', justifyContent: 'center' },
  sliderFill: { height: '100%', backgroundColor: '#8B5CF6' },
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  saveGradient: { paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  rightText: { color: '#FFF', fontSize: 13, fontWeight: '600', textAlign: 'right', writingDirection: 'rtl' },
});
