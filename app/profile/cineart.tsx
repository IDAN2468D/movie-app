import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ScrollView, ActivityIndicator, I18nManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gyroscope } from 'expo-sensors';
import Svg, { Rect, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ChevronRight, ChevronLeft, Award, Sparkles, RefreshCw } from 'lucide-react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Theme';
import { API_BASE_URL } from '@/constants/Config';
import { safeFetch } from '@/store/apiHelper';
import { useAuthStore } from '@/store/useAuthStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Spring Presets for organic movement
const SpringPresets = {
  snappy: {
    damping: 12,
    stiffness: 150,
    mass: 0.8,
  }
};

export default function CineArtStudioScreen() {
  const insets = useSafeAreaInsets();
  const [selectedTier, setSelectedTier] = useState<'Standard' | 'VIP' | 'Legendary'>('Standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [svgData, setSvgData] = useState<string | null>(null);

  // Gyroscope tracking shared values
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  useEffect(() => {
    let subscription: any = null;

    Gyroscope.setUpdateInterval(16); // ~60fps
    subscription = Gyroscope.addListener((data) => {
      // Scale coordinates for smooth rotation
      rotateX.value = withSpring(data.y * 12, SpringPresets.snappy);
      rotateY.value = withSpring(-data.x * 12, SpringPresets.snappy);
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  const handleGenerateTicket = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsGenerating(true);
    setSvgData(null);

    try {
      const token = useAuthStore.getState().token;
      const response = await safeFetch(`${API_BASE_URL}/mcp/generate-svg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          movieId: '299534',
          movieTitle: 'Avengers: Endgame',
          genre: 'Action',
          tier: selectedTier,
        }),
      });

      if (response.success && response.data?.svgFrameData) {
        setSvgData(response.data.svgFrameData);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      console.error('CineArt generation error:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Background Glow */}
      <View className="absolute top-1/4 left-1/4 w-[300] h-[300] bg-primary/10 rounded-full blur-[100px]" />
      <View className="absolute bottom-1/4 right-1/4 w-[250] h-[250] bg-[#E5FF00]/5 rounded-full blur-[80px]" />

      {/* Header */}
      <View 
        className="flex-row items-center px-6 pb-4 pt-2 gap-4 z-20"
        style={{ marginTop: insets.top }}
      >
        <Pressable 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }} 
          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 justify-center items-center active:scale-95"
        >
          {I18nManager.isRTL ? <ChevronRight size={24} color="white" /> : <ChevronLeft size={24} color="white" />}
        </Pressable>
        
        <View className="flex-1 items-start">
          <Text className="text-h2 text-white font-display leading-tight text-left" style={{ fontFamily: 'Rubik-Bold' }}>CineArt Studio 🎨</Text>
          <Text className="text-caption text-white/50 font-medium text-left" style={{ fontFamily: 'Assistant-Regular' }}>סטודיו כרטיסי אספנות דינמיים</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 mt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Tier Selector */}
        <View className="flex-row bg-white/5 border border-white/10 rounded-2xl p-1 mb-8">
          {(['Standard', 'VIP', 'Legendary'] as const).map((tier) => (
            <Pressable
              key={tier}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedTier(tier);
              }}
              className={`flex-1 py-3 rounded-xl items-center ${selectedTier === tier ? 'bg-primary' : 'bg-transparent'}`}
            >
              <Text className="text-white font-semibold" style={{ fontFamily: 'Rubik-Medium' }}>{tier}</Text>
            </Pressable>
          ))}
        </View>

        {/* Dynamic Card Display */}
        <View className="items-center justify-center mb-8" style={{ height: 420 }}>
          <Animated.View style={[styles.ticketCard, cardStyle]}>
            <BlurView intensity={30} tint="dark" className="absolute inset-0 rounded-[32px] overflow-hidden" />
            {isGenerating ? (
              <View className="flex-1 items-center justify-center p-6">
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text className="text-white/60 text-sm mt-4 text-center" style={{ fontFamily: 'Assistant-Regular' }}>
                  מייצר כרטיס אספנות דינמי...
                </Text>
              </View>
            ) : svgData ? (
              // Simulating custom SVG using structured render
              <View className="flex-1 p-6 justify-between border border-white/15 rounded-[32px]">
                <View className="flex-row justify-between items-center">
                  <Award size={24} color={selectedTier === 'Legendary' ? '#E5FF00' : 'white'} />
                  <Text className="text-white/40 text-xs font-bold" style={{ fontFamily: 'Rubik-Bold' }}>CINEBOOK COLLECTIBLE</Text>
                </View>
                
                <View className="items-center my-6">
                  <Text className="text-white text-3xl font-bold text-center mb-2" style={{ fontFamily: 'Rubik-Bold' }}>AVENGERS</Text>
                  <Text className="text-primary text-xs font-bold uppercase tracking-widest" style={{ fontFamily: 'Rubik-Medium' }}>{selectedTier} Tier Pass</Text>
                </View>

                <View className="border-t border-dashed border-white/20 pt-6 items-center">
                  <Sparkles size={20} color="#00E5FF" className="mb-2" />
                  <Text className="text-white/60 text-[10px]" style={{ fontFamily: 'Assistant-Regular' }}>הטיל את הטלפון כדי לראות את אפקט הזכוכית</Text>
                </View>
              </View>
            ) : (
              <View className="flex-1 items-center justify-center p-6 border border-white/10 rounded-[32px]">
                <Sparkles size={40} color="rgba(255, 255, 255, 0.3)" />
                <Text className="text-white/60 text-sm mt-4 text-center" style={{ fontFamily: 'Assistant-Regular' }}>
                  בחר רמת כרטיס למעלה ולחץ על "ייצר כרטיס אספנות"
                </Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* Action Button */}
        <Pressable
          onPress={handleGenerateTicket}
          disabled={isGenerating}
          className="bg-primary py-4 rounded-xl items-center flex-row justify-center gap-2 active:scale-95 mb-6"
        >
          <RefreshCw size={18} color="white" />
          <Text className="text-white font-bold text-base" style={{ fontFamily: 'Rubik-Bold' }}>ייצר כרטיס אספנות</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ticketCard: {
    width: width * 0.75,
    height: 400,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  }
});
