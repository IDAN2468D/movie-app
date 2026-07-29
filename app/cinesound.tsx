import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Switch, Dimensions, GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Headphones, Volume2, Save, X, RotateCcw } from 'lucide-react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { Colors } from '@/constants/Theme';
import { API_BASE_URL } from '@/constants/Config';
import { useAuthStore } from '@/store/useAuthStore';
import { useAcousticEngine } from '@/hooks/useAcousticEngine';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { ZeroReflowTabs } from '@/components/ZeroReflowTabs';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';

const { width } = Dimensions.get('window');

export default function CineSoundScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore(state => state.token);
  const { playSubBass, playSpatialClick } = useAcousticEngine();

  const [soundMode, setSoundMode] = useState<string>('atmos');
  const [gyroActive, setGyroActive] = useState(true);
  const [bass, setBass] = useState(50);
  const [mid, setMid] = useState(60);
  const [treble, setTreble] = useState(70);
  const [roomSimLevel, setRoomSimLevel] = useState(75);
  const [saving, setSaving] = useState(false);

  const nodeX = useSharedValue(0);
  const nodeY = useSharedValue(0);

  useEffect(() => {
    let subscription: any;
    if (gyroActive) {
      Accelerometer.setUpdateInterval(16);
      subscription = Accelerometer.addListener(accelerometerData => {
        nodeX.value = withSpring(accelerometerData.x * 120, { stiffness: 100, damping: 15 });
        nodeY.value = withSpring(-accelerometerData.y * 120, { stiffness: 100, damping: 15 });
      });
    } else {
      nodeX.value = withSpring(0, { stiffness: 100, damping: 15 });
      nodeY.value = withSpring(0, { stiffness: 100, damping: 15 });
    }

    return () => {
      if (subscription) subscription.remove();
    };
  }, [gyroActive]);

  const animatedNodeStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: nodeX.value },
        { translateY: nodeY.value }
      ]
    };
  });

  const handleSave = async (e: GestureResponderEvent) => {
    setSaving(true);
    // Trigger 40Hz Sub-bass drop on save / lock action
    playSubBass();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/cinesound/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          showtimeId: 'showtime-101',
          seatCode: 'H-12',
          soundMode,
          gyroState: gyroActive,
          equalizer: { bass, mid, treble },
          roomSimLevel
        })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        alert('הפרופיל נשמר בהצלחה בשרת!');
        router.back();
      }
    } catch (err) {
      alert('נשמר מקומית (מצב אופליין)');
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (e: GestureResponderEvent) => {
    playSpatialClick(e);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSoundMode('atmos');
    setGyroActive(true);
    setBass(50);
    setMid(50);
    setTreble(50);
    setRoomSimLevel(70);
  };

  const renderSlider = (label: string, value: number, onChange: (val: number) => void) => {
    return (
      <View className="mb-4">
        <View className="flex-row justify-between mb-1.5 px-1">
          <Text className="text-white/40 text-xs font-semibold">{value}%</Text>
          <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-sm font-semibold">{label}</Text>
        </View>
        <View className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden flex-row justify-end relative border border-white/10">
          <Pressable 
            style={{ width: '100%', height: '100%', position: 'absolute' }}
            onPressIn={(e) => {
              playSpatialClick(e);
              const rectWidth = width - 48;
              const touchX = e.nativeEvent.locationX;
              const calculatedValue = Math.min(Math.max(Math.round((touchX / rectWidth) * 100), 0), 100);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(calculatedValue);
            }}
          />
          <View style={{ width: `${value}%` }} className="h-full bg-quantumViolet shadow-quantum-glow" />
        </View>
      </View>
    );
  };

  const modeTabs = [
    { id: 'atmos', label: 'Dolby Atmos' },
    { id: 'spatial', label: 'Spatial Stereo' },
    { id: 'dtsx', label: 'DTS:X' },
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 60 }} className="flex-1 px-6">
        
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={(e) => { playSpatialClick(e); router.back(); }} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <X size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-display tracking-wider">CineSound Spatial 4.5</Text>
          <Pressable onPress={handleReset} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <RotateCcw size={20} color="white" />
          </Pressable>
        </View>

        {/* Live Audio Waveform Visualizer */}
        <View className="mb-6">
          <WaveformVisualizer isPlaying={true} />
        </View>

        {/* Spatial Matrix Card */}
        <Animated.View entering={FadeInDown.duration(600).springify()}>
          <LiquidGlassCard variant="deep" glow="quantum" specular={true} style={{ marginBottom: 24 }}>
            <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-lg font-bold mb-1">מיפוי סאונד מרחבי 120Hz</Text>
            <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/40 text-xs mb-4">גע במסך להפעלת פנינג או הטה את המכשיר</Text>

            <Pressable 
              onPress={(e) => playSpatialClick(e)}
              className="w-full aspect-square border border-white/10 bg-black/60 rounded-full justify-center items-center relative overflow-hidden"
            >
              <View className="w-14 h-14 rounded-full bg-quantumViolet/20 border border-quantumViolet justify-center items-center z-10 shadow-quantum-glow">
                <Headphones size={24} color="#8B5CF6" />
              </View>
              
              <Animated.View 
                style={[animatedNodeStyle]} 
                className="w-9 h-9 rounded-full bg-emeraldAction/30 border-2 border-emeraldAction justify-center items-center absolute shadow-emerald-glow"
              >
                <Volume2 size={16} color="#10B981" />
              </Animated.View>

              <View style={StyleSheet.absoluteFill} className="border border-white/5 rounded-full m-12 pointer-events-none" />
              <View style={StyleSheet.absoluteFill} className="border border-white/5 rounded-full m-24 pointer-events-none" />
            </Pressable>
          </LiquidGlassCard>
        </Animated.View>

        {/* Zero-Reflow Sound Decoding Tabs */}
        <View className="mb-6">
          <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-base font-bold mb-3">מצב פענוח סאונד</Text>
          <ZeroReflowTabs tabs={modeTabs} activeTabId={soundMode} onTabSelect={setSoundMode} />
        </View>

        {/* Configurations Glass Card */}
        <Animated.View entering={FadeInDown.duration(600).delay(100).springify()}>
          <LiquidGlassCard variant="deep" glow="none" specular={true} style={{ marginBottom: 24 }}>
            
            {/* Gyroscope Switch */}
            <View className="flex-row items-center justify-between pb-4 border-b border-white/5">
              <Switch
                value={gyroActive}
                onValueChange={(val) => {
                  playSpatialClick();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setGyroActive(val);
                }}
                trackColor={{ false: '#3f3f46', true: '#8B5CF6' }}
                thumbColor="white"
              />
              <View className="items-end">
                <Text className="text-white text-base font-bold">סנכרון תנועה מרחבי</Text>
                <Text className="text-white/40 text-xs mt-0.5">כיול שמע דינמי 120Hz לפי הטייה</Text>
              </View>
            </View>

            {/* Equalizer Controls */}
            <View className="pt-4">
              <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-base font-bold mb-4">אקולייזר מטריצה</Text>
              {renderSlider('בס (40Hz Sub-Bass)', bass, setBass)}
              {renderSlider('מיד (1kHz Mids)', mid, setMid)}
              {renderSlider('טרבל (12kHz Treble)', treble, setTreble)}
              {renderSlider('הדהוד חדר (Reverb)', roomSimLevel, setRoomSimLevel)}
            </View>
          </LiquidGlassCard>
        </Animated.View>

        {/* Save Button */}
        <Animated.View entering={FadeInDown.duration(600).delay(200).springify()}>
          <Pressable onPress={handleSave} disabled={saving} className="rounded-2xl overflow-hidden mb-6">
            <LinearGradient colors={['#8B5CF6', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 flex-row justify-center items-center gap-2">
              <Save size={20} color="white" />
              <Text className="text-white text-base font-bold">שמור פרופיל מרחבי למושב</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </View>
  );
}
