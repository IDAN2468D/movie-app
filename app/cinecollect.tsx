import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gift, X, Sparkles, AlertCircle, RefreshCw } from 'lucide-react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Accelerometer } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { API_BASE_URL } from '@/constants/Config';
import { useAuthStore } from '@/store/useAuthStore';
import Svg, { Path, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

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
  const token = useAuthStore(state => state.token);

  const [collectibles, setCollectibles] = useState<ICollectible[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLocalFallback, setIsLocalFallback] = useState(false);

  // Accelerometer shared values for 3D gyro tilt
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    fetchCollectibles();

    // Configure Accelerometer sensor
    Accelerometer.setUpdateInterval(25);
    const subscription = Accelerometer.addListener(data => {
      // Smoothly interpolate sensor changes
      tiltX.value = withSpring(data.x * 25, { damping: 18 });
      tiltY.value = withSpring(-data.y * 25, { damping: 18 });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const fetchCollectibles = async () => {
    setLoading(true);
    setIsLocalFallback(false);
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/collectibles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('API server unreachable');
      const json = await response.json();
      if (json.success) {
        setCollectibles(json.data);
      }
    } catch (err) {
      console.warn('CineCollect API failed, loading local simulated items:', err);
      setIsLocalFallback(true);
      setCollectibles([
        {
          _id: 'col-golden-ticket',
          collectibleId: 'col-golden-ticket',
          title: 'כרטיס הזהב הקולנועי',
          description: 'כרטיס זהב יוקרתי המוענק לחברי מועדון פרימיום.',
          rarity: 'legendary',
          modelUrl: 'ticket',
          colorGlow: '#E5FF00',
        },
        {
          _id: 'col-projector',
          collectibleId: 'col-projector',
          title: 'מקרן רטרו 1920',
          description: 'הולוגרמה של מקרן סרטים ישן ומכובד.',
          rarity: 'rare',
          modelUrl: 'projector',
          colorGlow: '#0AEFFF',
        },
        {
          _id: 'col-popcorn',
          collectibleId: 'col-popcorn',
          title: 'גביע פופקורן אינסופי',
          description: 'גביע פופקורן מנצנץ לחובבי קולנוע אמיתיים.',
          rarity: 'common',
          modelUrl: 'popcorn',
          colorGlow: '#FF1464',
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDoubleTap = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Gyro reactive style for the 3D showcase stub
  const animatedGyroStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 400 },
        { rotateY: `${tiltX.value}deg` },
        { rotateX: `${tiltY.value}deg` }
      ]
    };
  });

  const getRarityDetails = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return { label: 'אגדי (Legendary)', color: '#E5FF00' };
      case 'rare':
        return { label: 'נדיר (Rare)', color: '#0AEFFF' };
      default:
        return { label: 'נפוץ (Common)', color: '#9e9e9e' };
    }
  };

  const activeItem = collectibles[selectedIdx];
  const activeRarity = activeItem ? getRarityDetails(activeItem.rarity) : null;

  // Render vector SVG models corresponding to the item type
  const renderItemSvg = (model: string, glowColor: string) => {
    if (model === 'ticket') {
      return (
        <Svg width="160" height="240" viewBox="0 0 160 240" fill="none">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={glowColor} stopOpacity="0.4" />
              <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="160" height="240" rx="20" fill="url(#glow)" />
          {/* Ticket Body */}
          <Path d="M20,10 H140 A10,10 0 0,1 150,20 V90 A15,15 0 0,0 150,120 V220 A10,10 0 0,1 140,230 H20 A10,10 0 0,1 10,220 V120 A15,15 0 0,0 10,90 V20 A10,10 0 0,1 20,10 Z" fill="rgba(255, 255, 255, 0.08)" stroke={glowColor} strokeWidth="2.5" />
          {/* Shiny Stripes */}
          <Path d="M30,30 V210 M130,30 V210" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" strokeDasharray="5,5" />
          <Path d="M50,120 H110" stroke={glowColor} strokeWidth="3" />
          <Text style={{ textAlign: 'center', color: '#fff', fontSize: 10, marginTop: 40 }} className="font-display">CINEBOOK</Text>
        </Svg>
      );
    } else if (model === 'projector') {
      return (
        <Svg width="160" height="240" viewBox="0 0 160 240" fill="none">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={glowColor} stopOpacity="0.4" />
              <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="160" height="240" rx="20" fill="url(#glow)" />
          {/* Projector outline */}
          <Path d="M30,80 H100 V140 H30 Z" fill="rgba(255,255,255,0.08)" stroke={glowColor} strokeWidth="2.5" />
          {/* Lenses */}
          <Path d="M100,100 L130,80 V140 L100,120 Z" fill="rgba(255,255,255,0.04)" stroke={glowColor} strokeWidth="2" />
          {/* Film Reels */}
          <Circle cx="45" cy="50" r="22" stroke="white" strokeWidth="2" fill="none" />
          <Circle cx="85" cy="50" r="22" stroke="white" strokeWidth="2" fill="none" />
        </Svg>
      );
    } else {
      // Popcorn
      return (
        <Svg width="160" height="240" viewBox="0 0 160 240" fill="none">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={glowColor} stopOpacity="0.4" />
              <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="160" height="240" rx="20" fill="url(#glow)" />
          {/* Popcorn Cup */}
          <Path d="M40,90 L50,210 H110 L120,90 Z" fill="rgba(255,255,255,0.08)" stroke={glowColor} strokeWidth="2.5" />
          {/* Stripes */}
          <Path d="M60,90 L67,210 M80,90 L80,210 M100,90 L93,210" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          {/* Popcorn Top */}
          <Path d="M35,90 C35,80 50,70 60,80 C70,70 80,75 90,80 C100,70 115,75 125,90 Z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2" />
        </Svg>
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }} className="flex-1 px-6">
        
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <Pressable onPress={() => router.back()} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <X size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-display">CineCollect 3D Showcase</Text>
          <Pressable onPress={fetchCollectibles} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <RefreshCw size={20} color="white" />
          </Pressable>
        </View>

        {isLocalFallback && (
          <View className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex-row items-center gap-3 mb-6">
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
            {/* 3D Gyro Display Case */}
            {activeItem && (
              <Animated.View entering={FadeInDown.duration(700).springify()} className="items-center mb-6">
                <Pressable onPress={handleDoubleTap} delayLongPress={800}>
                  <Animated.View 
                    style={[animatedGyroStyle]} 
                    className="w-64 aspect-[3/4] border border-white/10 bg-surfaceLight/40 rounded-3xl justify-center items-center relative overflow-hidden shadow-2xl"
                  >
                    {/* Inner glowing core background */}
                    <View style={{ position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: activeItem.colorGlow, opacity: 0.1, filter: 'blur(30px)' }} />
                    
                    {renderItemSvg(activeItem.modelUrl, activeItem.colorGlow)}
                  </Animated.View>
                </Pressable>
                <Text className="text-white/40 text-xs mt-3">הטו את המכשיר כדי להטות את המזכרת באור</Text>
              </Animated.View>
            )}

            {/* Item Details Card */}
            {activeItem && activeRarity && (
              <Animated.View entering={FadeInDown.duration(700).delay(100).springify()} className="rounded-3xl border border-white/10 bg-surfaceLight p-5 mb-6">
                <View className="flex-row-reverse items-center justify-between mb-2">
                  <Text className="text-white text-lg font-bold">{activeItem.title}</Text>
                  <View style={{ backgroundColor: `${activeRarity.color}15`, borderColor: `${activeRarity.color}40` }} className="border px-3 py-1 rounded-full">
                    <Text style={{ color: activeRarity.color }} className="text-xs font-bold">{activeRarity.label}</Text>
                  </View>
                </View>
                <Text style={{ textAlign: 'right', lineHeight: 22 }} className="text-white/60 text-sm">{activeItem.description}</Text>
              </Animated.View>
            )}

            {/* Horizontal Collectibles Tray */}
            <Animated.View entering={FadeInDown.duration(700).delay(200).springify()} className="mb-4">
              <Text style={{ textAlign: 'right' }} className="text-white/40 text-xs mb-3">רשימת המזכרות שלך ({collectibles.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {collectibles.map((item, idx) => {
                  const isSelected = idx === selectedIdx;
                  return (
                    <Pressable
                      key={item._id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedIdx(idx);
                      }}
                      className={`w-20 h-20 rounded-2xl border items-center justify-center bg-surfaceLight ${isSelected ? 'border-primary' : 'border-white/10'}`}
                    >
                      <Gift size={26} color={isSelected ? Colors.primary : 'rgba(255,255,255,0.4)'} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </View>
        )}

      </View>
    </View>
  );
}

// Custom Circle and Text imports for React Native SVG
import { Circle } from 'react-native-svg';
