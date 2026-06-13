import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Image, Dimensions, I18nManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming,
  SharedValue
} from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { useSnackLabStore } from '@/store/useSnackLabStore';
import { useSnacksStore } from '@/store/useSnacksStore';
import { useBookingStore } from '@/store/useBookingStore';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Available topping colors
const TOPPING_COLORS: Record<string, string> = {
  'גומי יין': '#FF1744',
  'עדשי שוקולד': '#FFEA00',
  'מרשמלו': '#F50057',
  'אגוזים מקורמלים': '#FF9100'
};

let particleIdCounter = 0;
const generateParticleId = () => {
  particleIdCounter++;
  return `particle-${Date.now()}-${particleIdCounter}-${Math.random()}`;
};

const getRandomX = () => {
  return 30 + Math.random() * 100;
};

const CandyParticle = ({ x, targetY, color }: { x: number; targetY: number; color: string }) => {
  const yVal = useSharedValue(-20);

  useEffect(() => {
    yVal.value = withSpring(targetY, { damping: 6, stiffness: 80 });
  }, [targetY]);

  const particleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: yVal.value,
    left: x,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color,
    shadowColor: color,
    shadowRadius: 4,
    shadowOpacity: 0.6,
  }));

  return <Animated.View style={particleStyle} />;
};

export default function SnackLabScreen() {
  const insets = useSafeAreaInsets();
  const selectedMoviePoster = useBookingStore(state => state.selectedMoviePoster);
  const { currentCombo, updateButterLevel, updateFlavorRatios, addTopping, removeTopping, resetLab } = useSnackLabStore();
  const { addItem } = useSnacksStore();

  const [particles, setParticles] = useState<{ id: string; x: number; targetY: number; color: string }[]>([]);
  const [flavorMode, setFlavorMode] = useState<'salted' | 'sweet' | 'mixed'>('salted');

  // Reanimated values for liquid wiggles
  const liquidWiggle = useSharedValue(0);
  const beakerScale = useSharedValue(1);

  useEffect(() => {
    // Reset lab state on load
    resetLab();
    
    // Animate wiggling liquid
    liquidWiggle.value = withRepeat(
      withTiming(10, { duration: 1800 }),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const liquidHeight = useSharedValue(60); // Base height of liquid in beaker

  useEffect(() => {
    // Liquid level rises with butter level
    const targetHeight = 40 + (currentCombo.butterLevel / 100) * 70;
    liquidHeight.value = withSpring(targetHeight, { damping: 12 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCombo.butterLevel]);

  const animatedLiquidStyle = useAnimatedStyle(() => {
    // Combine base height and slight wiggle
    const wiggleOffset = Math.sin(liquidWiggle.value) * 3;
    const finalHeight = liquidHeight.value + wiggleOffset;
    
    let liquidColor = 'rgba(255, 193, 7, 0.7)'; // Salted butter gold
    if (flavorMode === 'sweet') liquidColor = 'rgba(233, 30, 99, 0.7)'; // Sweet pink glaze
    else if (flavorMode === 'mixed') liquidColor = 'rgba(156, 39, 176, 0.7)'; // Mixed purple glaze

    return {
      position: 'absolute',
      bottom: 10,
      left: 10,
      right: 10,
      height: finalHeight,
      backgroundColor: liquidColor,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    };
  });

  const animatedBeakerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(beakerScale.value) }]
  }));

  // Drop candy particle with physics
  const handleDropTopping = (topping: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addTopping(topping);
    beakerScale.value = 0.95;
    beakerScale.value = withSpring(1.0, { damping: 10 });

    const id = generateParticleId();
    const randomX = getRandomX(); // Constrained inside beaker width
    const targetY = 190 - liquidHeight.value; // Target landing height

    const newParticle = {
      id,
      x: randomX,
      targetY,
      color: TOPPING_COLORS[topping] || '#FFF'
    };

    setParticles(prev => [...prev, newParticle]);
  };

  const handleRemoveTopping = (topping: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeTopping(topping);
    // Remove last matching particle visual
    setParticles(prev => {
      const idx = [...prev].reverse().findIndex(p => p.color === TOPPING_COLORS[topping]);
      if (idx === -1) return prev;
      const actualIdx = prev.length - 1 - idx;
      return prev.filter((_, i) => i !== actualIdx);
    });
  };

  const handleSelectFlavor = (mode: 'salted' | 'sweet' | 'mixed') => {
    Haptics.selectionAsync();
    setFlavorMode(mode);
    if (mode === 'salted') updateFlavorRatios(0, 100);
    else if (mode === 'sweet') updateFlavorRatios(100, 0);
    else updateFlavorRatios(50, 50);
  };

  const handleAddComboToCart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Generate unique custom ID
    const customId = `custom_popcorn_${Date.now()}`;
    const customPrice = 35 + currentCombo.priceModifier;
    
    // Create compound naming and descriptions
    const flavorText = flavorMode === 'salted' ? 'מלוח' : flavorMode === 'sweet' ? 'מתוק' : 'משולב מתוק-מלוח';
    const butterText = currentCombo.butterLevel > 75 ? 'חמאה כפולה' : currentCombo.butterLevel > 30 ? 'חמאה רגילה' : 'ללא חמאה';
    const toppingsText = currentCombo.toppings.length > 0 ? `תוספות: ${currentCombo.toppings.join(', ')}` : 'ללא תוספות';
    const name = `פופקורן Lab - ${flavorText}`;
    const description = `${butterText} (${currentCombo.butterLevel}%), ${toppingsText}`;

    const newSnackItem = {
      id: customId,
      name,
      description,
      price: customPrice,
      image: require('../../assets/images/snacks/xl-popcorn.png'),
      category: 'Popcorn' as const,
      customizations: {
        butterLevel: currentCombo.butterLevel,
        flavors: [flavorText],
        toppings: currentCombo.toppings
      }
    };

    // Dynamically insert into useSnacksStore items array to avoid schema breaks
    useSnacksStore.setState(state => ({
      items: [newSnackItem, ...state.items]
    }));

    // Trigger standard cart addition
    addItem(customId);

    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      {/* Background Poster */}
      <View className="absolute inset-0">
        {selectedMoviePoster && (
          <Image 
            source={{ uri: `https://image.tmdb.org/t/p/w1280${selectedMoviePoster}` }}
            className="w-full h-full"
            resizeMode="cover"
          />
        )}
        <BlurView intensity={100} tint="dark" className="absolute inset-0" />
        <LinearGradient 
          colors={['transparent', 'rgba(0,0,0,0.8)', Colors.background]} 
          className="absolute inset-0" 
        />
      </View>

      {/* Header */}
      <View 
        className="flex-row items-center px-6 pb-4 pt-2 gap-4 z-20"
        style={{ marginTop: insets.top }}
      >
        <Pressable 
          onPress={() => router.back()} 
          className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 justify-center items-center active:scale-95"
        >
          {I18nManager.isRTL ? <ChevronRight size={24} color="white" /> : <ChevronLeft size={24} color="white" />}
        </Pressable>
        
        <View className="flex-1 items-start">
          <Text className="text-h2 text-white font-display leading-tight text-left">מעבדת נשנושים 🧪</Text>
          <Text className="text-caption text-white/50 font-medium text-left">הרכב את שילוב הפופקורן המושלם עבורך</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 mt-4" showsVerticalScrollIndicator={false}>
        {/* Lab Physics Beaker Container */}
        <View className="items-center justify-center my-6 h-[240px] relative">
          
          {/* Main Glass Beaker wiggling scale */}
          <Animated.View style={[{ width: 180, height: 210, position: 'relative' }, animatedBeakerStyle]}>
            
            {/* Liquid Fill back layer */}
            <Animated.View style={animatedLiquidStyle} />

            {/* Falling candy particles */}
            {particles.map((p) => (
              <CandyParticle key={p.id} x={p.x} targetY={p.targetY} color={p.color} />
            ))}

            {/* Glass Beaker Overlay SVG */}
            <View className="absolute inset-0 z-10 pointer-events-none">
              <Svg width={180} height={210} viewBox="0 0 180 210">
                {/* Outlines of glass beaker */}
                <Path 
                  d="M10 10 H170 V20 H160 L160 190 Q160 200 150 200 H30 Q20 200 20 190 L20 20 H10 Z" 
                  fill="none" 
                  stroke="rgba(255, 255, 255, 0.25)" 
                  strokeWidth={3} 
                />
                {/* Measurement scale markers */}
                <Rect x={25} y={50} width={15} height={1.5} fill="rgba(255,255,255,0.4)" />
                <Rect x={25} y={90} width={20} height={1.5} fill="rgba(255,255,255,0.4)" />
                <Rect x={25} y={130} width={15} height={1.5} fill="rgba(255,255,255,0.4)" />
                <Rect x={25} y={170} width={25} height={1.5} fill="rgba(255,255,255,0.4)" />
              </Svg>
            </View>

          </Animated.View>

          {/* Sparkles glow */}
          <View className="absolute top-0 right-10">
            <Sparkles size={24} color={Colors.secondary} />
          </View>
        </View>

        {/* Customizers sliders cards */}
        <View className="bg-surfaceLight/80 border border-white/10 rounded-[32px] p-6 mb-6">
          <Text className="text-h3 text-white text-right mb-4 font-display">1. בחר בסיס טעם</Text>
          <View className="flex-row gap-3 mb-6" style={{ flexDirection: 'row-reverse' }}>
            <Pressable 
              onPress={() => handleSelectFlavor('salted')}
              className={`flex-1 py-3 rounded-2xl border justify-center items-center ${flavorMode === 'salted' ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/10'}`}
            >
              <Text className="text-white font-bold text-sm">🍿 מלוח</Text>
            </Pressable>
            <Pressable 
              onPress={() => handleSelectFlavor('sweet')}
              className={`flex-1 py-3 rounded-2xl border justify-center items-center ${flavorMode === 'sweet' ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/10'}`}
            >
              <Text className="text-white font-bold text-sm">🍭 מתוק</Text>
            </Pressable>
            <Pressable 
              onPress={() => handleSelectFlavor('mixed')}
              className={`flex-1 py-3 rounded-2xl border justify-center items-center ${flavorMode === 'mixed' ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/10'}`}
            >
              <Text className="text-white font-bold text-sm">✨ משולב</Text>
            </Pressable>
          </View>

          <Text className="text-h3 text-white text-right mb-2 font-display">2. סמיכות חמאה מלוחה ({currentCombo.butterLevel}%)</Text>
          
          {/* Butter Level control row */}
          <View className="flex-row items-center gap-3 mb-6" style={{ flexDirection: 'row-reverse' }}>
            <Text className="text-xs text-white/50">יבש</Text>
            <Slider 
              value={currentCombo.butterLevel} 
              onValueChange={updateButterLevel} 
            />
            <Text className="text-xs text-white/50">ספוג חמאה</Text>
          </View>

          <Text className="text-h3 text-white text-right mb-4 font-display">3. הוסף תוספות מתוקות (₪4 ליחידה)</Text>
          <View className="flex-row flex-wrap gap-2.5 justify-end mb-4">
            {Object.keys(TOPPING_COLORS).map((topping) => {
              const isActive = currentCombo.toppings.includes(topping);
              return (
                <Pressable
                  key={topping}
                  onPress={() => isActive ? handleRemoveTopping(topping) : handleDropTopping(topping)}
                  className={`px-4 py-2 rounded-full border flex-row items-center gap-1.5 ${isActive ? 'bg-white/15 border-white/30' : 'bg-white/5 border-white/10'}`}
                >
                  <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TOPPING_COLORS[topping] }} />
                  <Text className={`text-xs ${isActive ? 'text-white font-bold' : 'text-white/60'}`}>{topping}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

      </ScrollView>

      {/* Footer checkout total modifiers */}
      <BlurView 
        intensity={90} 
        tint="dark" 
        className="px-6 py-6 border-t border-white/10 rounded-t-[40px]"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}
      >
        <View className="flex-row items-center justify-between" style={{ flexDirection: 'row-reverse' }}>
          
          <View className="items-end">
            <Text className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-0.5">מחיר פופקורן Lab</Text>
            <Text>
              <Text className="text-h1 text-white font-display">₪{(35 + currentCombo.priceModifier).toFixed(0)}</Text>
              <Text className="text-caption text-primary font-bold">.00</Text>
            </Text>
          </View>

          <Pressable 
            onPress={handleAddComboToCart}
            className="overflow-hidden rounded-3xl"
          >
            <LinearGradient
              colors={[Colors.primary, '#D40054']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="flex-row items-center gap-3 px-8 py-4 justify-center"
            >
              <Text className="font-bold text-h3 font-display text-white">הוסף לסל 🍿</Text>
            </LinearGradient>
          </Pressable>

        </View>
      </BlurView>
    </View>
  );
}

// Simple custom inline slider component to avoid package conflicts
function Slider({ 
  value, 
  onValueChange 
}: { 
  value: number; 
  onValueChange: (v: number) => void 
}) {
  const barWidth = SCREEN_WIDTH - 150;
  
  return (
    <View 
      className="h-10 justify-center relative"
      style={{ width: barWidth }}
    >
      <View className="w-full h-1 bg-white/10 rounded-full" />
      <View 
        className="h-1 bg-primary rounded-full absolute" 
        style={{ width: `${value}%`, left: 0 }} 
      />
      
      {/* Slider Knobs with absolute gestures mapping */}
      <View 
        className="absolute w-5 h-5 bg-white rounded-full border border-primary justify-center items-center shadow-md"
        style={{ left: `${value}%`, marginLeft: -10 }}
        onTouchMove={(e) => {
          const touchX = e.nativeEvent.locationX;
          const percentage = Math.max(0, Math.min(100, Math.round((touchX / barWidth) * 100)));
          onValueChange(percentage);
        }}
      />
    </View>
  );
}
