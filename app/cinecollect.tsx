import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gift, X, AlertCircle, RefreshCw } from 'lucide-react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Accelerometer } from 'expo-sensors';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { API_BASE_URL } from '@/constants/Config';
import { useAuthStore } from '@/store/useAuthStore';
import { CollectiblesSvgModel } from '@/components/cinecollect/CollectiblesSvgModel';

interface ICollectible {
  _id: string;
  collectibleId: string;
  title: string;
  description?: string;
  rarity: 'common' | 'rare' | 'legendary';
  modelUrl: string;
  colorGlow: string;
}

export default function CineCollectScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((state) => state.token);

  const [collectibles, setCollectibles] = useState<ICollectible[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLocalFallback, setIsLocalFallback] = useState(false);

  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    fetchCollectibles();
    Accelerometer.setUpdateInterval(25);
    const sub = Accelerometer.addListener((data) => {
      tiltX.value = withSpring(data.x * 25, { damping: 18 });
      tiltY.value = withSpring(-data.y * 25, { damping: 18 });
    });
    return () => sub.remove();
  }, []);

  const fetchCollectibles = async () => {
    setLoading(true);
    setIsLocalFallback(false);
    try {
      const res = await fetch(`${API_BASE_URL}/mcp/collectibles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('API server unreachable');
      const json = await res.json();
      if (json.success) setCollectibles(json.data);
    } catch {
      setIsLocalFallback(true);
      setCollectibles([
        { _id: 'col-1', collectibleId: 'col-1', title: 'כרטיס הזהב הקולנועי', description: 'כרטיס זהב יוקרתי לחברי מועדון פרימיום.', rarity: 'legendary', modelUrl: 'ticket', colorGlow: '#E5FF00' },
        { _id: 'col-2', collectibleId: 'col-2', title: 'מקרן רטרו 1920', description: 'הולוגרמה של מקרן סרטים ישן ומכובד.', rarity: 'rare', modelUrl: 'projector', colorGlow: '#0AEFFF' },
        { _id: 'col-3', collectibleId: 'col-3', title: 'גביע פופקורן אינסופי', description: 'גביע פופקורן מנצנץ לחובבי קולנוע.', rarity: 'common', modelUrl: 'popcorn', colorGlow: '#FF1464' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const animatedGyroStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 400 }, { rotateY: `${tiltX.value}deg` }, { rotateX: `${tiltY.value}deg` }],
  }));

  const activeItem = collectibles[selectedIdx];

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }} className="flex-1 px-6">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <X size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-display">CineCollect 3D Showcase</Text>
          <Pressable onPress={fetchCollectibles} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <RefreshCw size={20} color="white" />
          </Pressable>
        </View>

        {isLocalFallback && (
          <View className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex-row items-center gap-3 mb-4">
            <AlertCircle size={18} color={Colors.warning} />
            <Text style={{ textAlign: 'right', flex: 1 }} className="text-amber-500 text-xs font-semibold">אוסף מוצג כעת במצב אופליין סימולטיבי</Text>
          </View>
        )}

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <View className="flex-1 justify-between">
            {activeItem && (
              <Animated.View entering={FadeInDown.duration(500)} className="items-center mb-4">
                <Animated.View style={[animatedGyroStyle]} className="w-60 aspect-[3/4] border border-white/10 bg-surfaceLight/40 rounded-3xl justify-center items-center relative overflow-hidden shadow-2xl">
                  <CollectiblesSvgModel model={activeItem.modelUrl} glowColor={activeItem.colorGlow} />
                </Animated.View>
                <Text className="text-white/40 text-xs mt-3">הטו את המכשיר כדי להטות את המזכרת באור</Text>
              </Animated.View>
            )}

            {activeItem && (
              <Animated.View entering={FadeInDown.duration(500).delay(100)} className="rounded-3xl border border-white/10 bg-surfaceLight p-5 mb-4">
                <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-lg font-bold mb-1">{activeItem.title}</Text>
                <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/60 text-sm">{activeItem.description}</Text>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.duration(500).delay(200)} className="mb-4">
              <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/40 text-xs mb-3">רשימת המזכרות שלך ({collectibles.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {collectibles.map((item, idx) => (
                  <Pressable
                    key={item._id}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedIdx(idx); }}
                    className={`w-16 h-16 rounded-2xl border items-center justify-center bg-surfaceLight ${idx === selectedIdx ? 'border-primary' : 'border-white/10'}`}
                  >
                    <Gift size={22} color={idx === selectedIdx ? Colors.primary : 'rgba(255,255,255,0.4)'} />
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          </View>
        )}
      </View>
    </View>
  );
}
