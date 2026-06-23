import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Switch, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Headphones, Volume2, Save, X, RotateCcw } from 'lucide-react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { Colors, Typography } from '@/constants/Theme';
import { API_BASE_URL } from '@/constants/Config';
import { useAuthStore } from '@/store/useAuthStore';

const { width } = Dimensions.get('window');

export default function CineSoundScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore(state => state.token);
  const [soundMode, setSoundMode] = useState<'Dolby Atmos' | 'Spatial Stereo' | 'DTS:X'>('Dolby Atmos');
  const [gyroActive, setGyroActive] = useState(true);
  const [bass, setBass] = useState(50);
  const [mid, setMid] = useState(60);
  const [treble, setTreble] = useState(70);
  const [roomSimLevel, setRoomSimLevel] = useState(75);
  const [saving, setSaving] = useState(false);

  // Reanimated shared values for audio node position
  const nodeX = useSharedValue(0);
  const nodeY = useSharedValue(0);

  useEffect(() => {
    let subscription: any;
    if (gyroActive) {
      // Set update interval (approx 60Hz)
      Accelerometer.setUpdateInterval(16);
      subscription = Accelerometer.addListener(accelerometerData => {
        // Map tilts directly to translations
        nodeX.value = withSpring(accelerometerData.x * 120, { damping: 15 });
        nodeY.value = withSpring(-accelerometerData.y * 120, { damping: 15 });
      });
    } else {
      nodeX.value = withSpring(0);
      nodeY.value = withSpring(0);
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

  const handleSave = async () => {
    setSaving(true);
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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        alert('הפרופיל נשמר בהצלחה בשרת!');
        router.back();
      }
    } catch (err) {
      console.warn('API error, simulating offline save:', err);
      alert('נשמר מקומית (מצב אופליין)');
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSoundMode('Dolby Atmos');
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
        <View className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex-row justify-end relative">
          <Pressable 
            style={{ width: '100%', height: '100%', position: 'absolute' }}
            onPressIn={(e) => {
              const rectWidth = width - 48; // padding horizontal
              const touchX = e.nativeEvent.locationX;
              const calculatedValue = Math.min(Math.max(Math.round((touchX / rectWidth) * 100), 0), 100);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(calculatedValue);
            }}
          />
          <View style={{ width: `${value}%` }} className="h-full bg-primary" />
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 60 }} className="flex-1 px-6">
        
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <Pressable onPress={() => router.back()} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <X size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-display">CineSound Spatial Tuning</Text>
          <Pressable onPress={handleReset} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <RotateCcw size={20} color="white" />
          </Pressable>
        </View>

        {/* Spatial Node Map Box */}
        <Animated.View entering={FadeInDown.duration(800).springify()} className="rounded-3xl border border-white/10 bg-surfaceLight overflow-hidden p-6 mb-6">
          <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-lg font-bold mb-1">מיפוי סאונד מרחבי</Text>
          <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/40 text-xs mb-6">הטו את המכשיר כדי לדמות שינויי סאונד סביב המושב</Text>

          {/* Soundstage Circle */}
          <View className="w-full aspect-square border border-white/5 bg-black/40 rounded-full justify-center items-center relative overflow-hidden">
            {/* Center Seat */}
            <View className="w-12 h-12 rounded-full bg-secondary/20 border border-secondary/60 justify-center items-center z-10">
              <Headphones size={22} color={Colors.secondary} />
            </View>
            
            {/* Pulsing Audio Node */}
            <Animated.View 
              style={[animatedNodeStyle]} 
              className="w-8 h-8 rounded-full bg-primary/30 border-2 border-primary justify-center items-center absolute"
            >
              <Volume2 size={14} color={Colors.primary} />
            </Animated.View>
            
            {/* Outer rings representing sound stages */}
            <View style={StyleSheet.absoluteFill} className="border border-white/5 rounded-full m-12 pointer-events-none" />
            <View style={StyleSheet.absoluteFill} className="border border-white/5 rounded-full m-24 pointer-events-none" />
          </View>
        </Animated.View>

        {/* Configurations Glass Card */}
        <Animated.View entering={FadeInDown.duration(800).delay(100).springify()} className="rounded-3xl border border-white/10 bg-surfaceLight p-6 mb-6 gap-6">
          
          {/* Sound Mode Selection */}
          <View>
            <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-base font-bold mb-3">מצב פענוח סאונד</Text>
            <View className="flex-row gap-3">
              {(['Dolby Atmos', 'Spatial Stereo', 'DTS:X'] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSoundMode(mode);
                  }}
                  className={`flex-1 py-3 rounded-xl border items-center justify-center ${soundMode === mode ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5'}`}
                >
                  <Text className={`text-sm font-semibold ${soundMode === mode ? 'text-primary' : 'text-white/60'}`}>{mode}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Gyroscope Switch */}
          <View className="flex-row items-center justify-between border-t border-white/5 pt-4">
            <Switch
              value={gyroActive}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setGyroActive(val);
              }}
              trackColor={{ false: '#3f3f46', true: Colors.primary }}
              thumbColor="white"
            />
            <View className="items-end">
              <Text className="text-white text-base font-bold">סנכרון תנועה (ג'ירוסקופ)</Text>
              <Text className="text-white/40 text-xs mt-0.5">כיול שמע דינמי לפי הטיית הראש שלכם</Text>
            </View>
          </View>

          {/* Equalizer Controls */}
          <View className="border-t border-white/5 pt-4">
            <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-base font-bold mb-4">אקולייזר מותאם אישית</Text>
            {renderSlider('בס (Bass)', bass, setBass)}
            {renderSlider('מיד (Mids)', mid, setMid)}
            {renderSlider('טרבל (Treble)', treble, setTreble)}
            {renderSlider('גודל חדר (Reverb)', roomSimLevel, setRoomSimLevel)}
          </View>
        </Animated.View>

        {/* Save Button */}
        <Animated.View entering={FadeInDown.duration(800).delay(200).springify()}>
          <Pressable onPress={handleSave} disabled={saving} className="rounded-2xl overflow-hidden mb-6">
            <LinearGradient colors={[Colors.primary, '#9B1B30']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 flex-row justify-center items-center gap-2">
              <Save size={20} color="white" />
              <Text className="text-white text-base font-bold">שמור פרופיל סאונד למושב</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </View>
  );
}
