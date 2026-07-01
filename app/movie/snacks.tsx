import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Dimensions, I18nManager, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ChevronRight, ChevronLeft, ShoppingCart, Plus, Minus, Trash2, Grip, Sparkles } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { SnackItem, useSnacksStore } from '@/store/useSnacksStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useCineSnacksAIStore } from '@/store/useCineSnacksAIStore';
import { AIService } from '@/services/AIService';
import Animated, { 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  ZoomIn, 
  ZoomOut, 
  Layout,
  runOnJS,
  SharedValue
} from 'react-native-reanimated';
import { useSnacks } from '@/hooks/useSnacks';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w1280';
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Premium animated fluid rising and fizzing drink bubble overlay
const FluidDrinkFill = ({ type }: { type: string }) => {
  const fillLevel = useSharedValue(0);
  const bubble1Y = useSharedValue(40);
  const bubble2Y = useSharedValue(40);

  useEffect(() => {
    fillLevel.value = withTiming(0.85, { duration: 1200 });
    
    // Animate fizz bubbles looping upwards
    bubble1Y.value = withRepeat(withTiming(-10, { duration: 1500 }), -1, false);
    bubble2Y.value = withRepeat(withTiming(-10, { duration: 1800 }), -1, false);
  }, []);

  const liquidStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: `${fillLevel.value * 100}%`,
    backgroundColor: type.includes('קולה') || type.includes('Cola') ? 'rgba(74, 38, 18, 0.75)' : 'rgba(255, 120, 0, 0.75)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  }));

  const bubble1Style = useAnimatedStyle(() => ({
    position: 'absolute',
    bottom: bubble1Y.value,
    left: 10,
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: 'rgba(255,255,255,0.7)',
    opacity: fillLevel.value > 0.2 ? 1 : 0,
  }));

  const bubble2Style = useAnimatedStyle(() => ({
    position: 'absolute',
    bottom: bubble2Y.value,
    right: 12,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    opacity: fillLevel.value > 0.4 ? 1 : 0,
  }));

  return (
    <View className="absolute inset-0 rounded-full overflow-hidden" pointerEvents="none">
      <Animated.View style={liquidStyle} />
      <Animated.View style={bubble1Style} />
      <Animated.View style={bubble2Style} />
    </View>
  );
};

// Tray Item Component rendering the snack with drink fill effects
function TraySnackItem({ 
  item, 
  allSnacks, 
  onRemove 
}: { 
  item: { id: string; key: string; name: string; image: any };
  allSnacks: SnackItem[];
  onRemove: () => void;
}) {
  const snackDetails = React.useMemo(() => {
    return allSnacks.find(s => s.id === item.id);
  }, [allSnacks, item.id]);

  const isDrink = snackDetails?.category === 'Drinks';

  return (
    <Animated.View
      entering={ZoomIn.springify().damping(12).mass(0.5)}
      exiting={ZoomOut.duration(150)}
      layout={Layout.springify()}
      className="items-center"
      style={{ overflow: 'visible' }}
    >
      <View className="relative w-[40px] h-[40px]">
        <Pressable
          onPress={onRemove}
          className="w-full h-full rounded-full bg-white/5 border border-white/10 p-1 justify-center items-center active:scale-95 overflow-hidden relative"
        >
          <Image 
            source={item.image}
            className="w-full h-full rounded-full"
            resizeMode="contain"
          />
          {isDrink && <FluidDrinkFill type={item.name} />}
        </Pressable>
        
        {/* Floating Tactile Delete Badge */}
        <Pressable
          onPress={onRemove}
          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full items-center justify-center border border-[#0A0A0C] shadow-md active:scale-90"
          style={{ zIndex: 10 }}
        >
          <Minus size={6.5} color="white" strokeWidth={4} />
        </Pressable>
      </View>
      
      <Text className="text-white/60 text-[7.5px] mt-0.5 font-semibold font-sans text-center w-[44px]" numberOfLines={1}>
        {item.name.split(' ')[0]}
      </Text>
    </Animated.View>
  );
}

export default function SnacksScreen() {
  const insets = useSafeAreaInsets();
  const {
    selectedMoviePoster,
    ticketsTotal,
    items: filteredItems,
    cart,
    activeCategory,
    categories,
    snacksTotal,
    handleCheckout,
    setCategory,
    addItem,
    removeItem,
    clearCart,
    goBack,
  } = useSnacks();

  const allSnacks = useSnacksStore(state => state.items);
  const fetchSnacks = useSnacksStore(state => state.fetchSnacks);

  useEffect(() => {
    fetchSnacks();
  }, []);

  const movieTitle = useBookingStore(state => state.selectedMovieTitle);
  const showtime = useBookingStore(state => state.selectedShowtime);

  const { recommendedIds: recIds, isLoading: isRecLoading, fetchRecommendations } = useCineSnacksAIStore();

  useEffect(() => {
    if (movieTitle) {
      fetchRecommendations(movieTitle, undefined, showtime?.format, showtime?.time);
    }
  }, [movieTitle, showtime]);

  const recommendedSnacks = React.useMemo(() => {
    return recIds.map(id => allSnacks.find(s => s.id === id)).filter(Boolean) as SnackItem[];
  }, [recIds, allSnacks]);

  const totalRecPrice = React.useMemo(() => {
    return recommendedSnacks.reduce((sum, s) => sum + s.price, 0);
  }, [recommendedSnacks]);

  // Flatten the cart into an array of individual items to render on the tray
  const trayItems = React.useMemo(() => {
    const list: { id: string; key: string; name: string; image: any }[] = [];
    Object.entries(cart).forEach(([id, quantity]) => {
      const item = allSnacks.find(i => i.id === id);
      if (item) {
        for (let i = 0; i < quantity; i++) {
          list.push({
            id,
            key: `${id}-${i}`,
            name: item.name,
            image: item.image,
          });
        }
      }
    });
    return list;
  }, [cart, allSnacks]);

  // Drag and Drop Shared Values
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const dragScale = useSharedValue(1);

  // Tray Pulse / Splash Effect Shared Value
  const traySplash = useSharedValue(0);

  const triggerTraySplash = () => {
    traySplash.value = 0;
    traySplash.value = withTiming(1, { duration: 600 });
  };

  const traySplashStyle = useAnimatedStyle(() => {
    return {
      borderColor: traySplash.value > 0 
        ? `rgba(255, 20, 100, ${0.18 + (1 - traySplash.value) * 0.6})` 
        : 'rgba(255, 20, 100, 0.18)',
      backgroundColor: '#0a0a0c',
      transform: [
        { scale: 1 + (1 - traySplash.value) * traySplash.value * 0.04 }
      ],
      shadowOpacity: traySplash.value > 0 ? 0.15 + (1 - traySplash.value) * 0.35 : 0.15,
      shadowRadius: traySplash.value > 0 ? 16 + (1 - traySplash.value) * 16 : 16,
    };
  });

  const [activeDragItem, setActiveDragItem] = React.useState<SnackItem | null>(null);

  const onDragStart = React.useCallback((item: SnackItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveDragItem(item);
  }, []);

  const onDragEnd = React.useCallback((x: number, y: number) => {
    if (!activeDragItem) return;
    
    // Check drop zone (typically bottom 35% above checkout bar)
    if (y > SCREEN_HEIGHT - 350 && y < SCREEN_HEIGHT - 100) {
      addItem(activeDragItem.id);
      triggerTraySplash();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setActiveDragItem(null);
  }, [activeDragItem, addItem]);

  // Floating Drag Overlay Style
  const floatingPreviewStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 2,
      borderColor: Colors.primary,
      backgroundColor: 'rgba(10, 10, 12, 0.95)',
      overflow: 'hidden',
      transform: [
        { translateX: dragX.value - 36 },
        { translateY: dragY.value - 36 },
        { scale: dragScale.value },
      ],
      opacity: isDragging.value ? 0.95 : 0,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 10,
    };
  });

  // Calculate instant combo discounts
  const hasComboDiscount = React.useMemo(() => {
    const hasPopcorn = Object.keys(cart).some(id => {
      const snack = allSnacks.find(s => s.id === id);
      return snack?.category === 'Popcorn';
    });
    const hasDrink = Object.keys(cart).some(id => {
      const snack = allSnacks.find(s => s.id === id);
      return snack?.category === 'Drinks';
    });
    return hasPopcorn && hasDrink;
  }, [cart, allSnacks]);

  const finalSnacksTotal = Math.max(0, snacksTotal - (hasComboDiscount ? 10 : 0));

  // Pulsing animation for the empty state tray
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
  }, []);

  const pulsingStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(255, 255, 255, ${0.08 + (pulse.value - 0.4) * 0.2})`,
  }));

  return (
    <View className="flex-1 bg-background">
      {/* Cinematic Background */}
      <View className="absolute inset-0">
        <Image 
          source={{ uri: `${TMDB_IMAGE_BASE_URL}${selectedMoviePoster}` }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <BlurView intensity={100} tint="dark" className="absolute inset-0" />
        <LinearGradient 
          colors={['transparent', 'rgba(0,0,0,0.8)', Colors.background]} 
          className="absolute inset-0" 
        />
      </View>

      {/* Header */}
      <View 
        className="flex-row items-center px-6 pb-4 pt-2 gap-4"
        style={{ marginTop: insets.top, zIndex: 20 }}
      >
        <Pressable 
          onPress={goBack} 
          className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 justify-center items-center active:scale-95"
        >
          {I18nManager.isRTL ? <ChevronRight size={24} color="white" /> : <ChevronLeft size={24} color="white" />}
        </Pressable>
        
        <View className="flex-1 items-start">
          <Text className="text-h2 text-white font-display leading-tight">נשנושים לסרט</Text>
          <Text className="text-caption text-white/50 font-medium">השלם את החוויה הקולנועית שלך</Text>
        </View>
      </View>

      {/* Categories */}
      <View className="mt-4" style={{ zIndex: 20 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ flexDirection: 'row-reverse', paddingHorizontal: 24, gap: 12 }}
        >
          {/* Custom Popcorn Lab Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/movie/snack-lab' as any);
            }}
            className="px-5 py-2.5 rounded-2xl bg-secondary/15 border border-secondary/35 justify-center items-center flex-row gap-1.5 active:bg-secondary/25 active:scale-95"
          >
            <Sparkles size={14} color={Colors.secondary} />
            <Text className="font-bold text-secondary text-sm">רקח פופקורן אישי 🧪</Text>
          </Pressable>

          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const label = cat === 'All' ? 'הכל' : 
                          cat === 'Popcorn' ? 'פופקורן' : 
                          cat === 'Drinks' ? 'שתייה' : 
                          cat === 'Combos' ? 'דילים' : 'מתוקים';
            if (isActive) {
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className="rounded-2xl overflow-hidden border border-primary/30 active:scale-95 shadow-sm" style={{ shadowColor: Colors.primary, shadowOpacity: 0.2 }}
                >
                  <LinearGradient
                    colors={[Colors.primary, '#D40054']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="px-6 py-2.5"
                  >
                    <Text className="font-bold text-white text-sm">
                      {label}
                    </Text>
                  </LinearGradient>
                </Pressable>
              );
            }
            return (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                className="px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 justify-center items-center active:bg-white/10 active:scale-95"
              >
                <Text className="font-bold text-white/60 text-sm">
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* CineMeal AI Recommendation Card */}
      {movieTitle && (isRecLoading || recommendedSnacks.length > 0) && (
        <Animated.View 
          entering={FadeInDown.duration(400)}
          className="mx-6 mt-4 rounded-3xl border border-white/10 overflow-hidden bg-surfaceLight"
          style={{
            shadowColor: Colors.secondary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 6,
          }}
        >
          <View className="p-5">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3 flex-1">
                {/* Glowing AI Icon Container */}
                <View className="w-9 h-9 rounded-xl bg-secondary/10 border border-secondary/25 items-center justify-center">
                  <Sparkles size={18} color={Colors.secondary} />
                </View>
                
                {/* Title Stack */}
                <View className="items-start flex-1">
                  <Text className="text-white font-bold text-[14px] font-sans" numberOfLines={1}>
                    CineMeal AI Recommendations
                  </Text>
                  <Text className="text-white/40 text-[10px] font-medium font-assistant mt-0.5" numberOfLines={1}>
                    התאמת נשנושים אישית מבוססת בינה מלאכותית
                  </Text>
                </View>
              </View>

              {/* Hot Deal Badge or Loading Indicator */}
              <View style={{ marginStart: 12 }}>
                {isRecLoading ? (
                  <ActivityIndicator size="small" color={Colors.secondary} />
                ) : (
                  <View className="bg-primary/15 border border-primary/30 px-2.5 py-1 rounded-full">
                    <Text className="text-primary text-[9px] font-bold font-assistant">מבצע חם 🔥</Text>
                  </View>
                )}
              </View>
            </View>

            {isRecLoading ? (
              <Text className="text-white/50 text-[12px] font-assistant text-left">
                מנתח את העדפות שלך ומתאים נשנושים...
              </Text>
            ) : (
              <View className="flex-col gap-4">
                <Text className="text-white/80 text-[12px] font-assistant text-left leading-relaxed">
                  התאמנו במיוחד עבורך לצפייה ב-<Text style={{ fontFamily: 'Rubik-Medium', color: 'white' }}>{movieTitle}</Text>:
                </Text>
                
                {/* Snack List Row */}
                <View className="flex-row flex-wrap gap-2.5 justify-start">
                  {recommendedSnacks.map((snack, idx) => (
                    <Animated.View 
                      key={snack.id} 
                      entering={ZoomIn.springify().damping(12).mass(0.5).delay(idx * 50)}
                      className="flex-row items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 overflow-hidden bg-white/10"
                    >
                      <BlurView intensity={30} tint="light" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                      {snack.image && <Image source={snack.image} className="w-6 h-6" resizeMode="contain" style={{ zIndex: 1 }} />}
                      <Text className="text-white text-[11px] font-bold font-assistant" style={{ zIndex: 1 }}>{snack.name}</Text>
                    </Animated.View>
                  ))}
                </View>

                {/* Add All Button */}
                <Pressable
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    recommendedSnacks.forEach(snack => {
                      addItem(snack.id);
                    });
                    triggerTraySplash();
                  }}
                  className="w-full rounded-2xl overflow-hidden active:scale-[0.98] shadow-md shadow-secondary/10 mt-1"
                >
                  <LinearGradient
                    colors={[Colors.secondary, '#B8CC00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="w-full py-3 flex-row-reverse items-center justify-center gap-2"
                    style={{ paddingStart: 12, paddingEnd: 12 }}
                  >
                    <Sparkles size={14} color={Colors.background} />
                    <Text className="font-bold text-background text-sm font-sans" style={{ writingDirection: 'ltr' }}>
                      ₪{totalRecPrice} • הוסף את כל המארז לסל
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </View>
        </Animated.View>
      )}

      {/* Snacks Grid */}
      <ScrollView 
        className="flex-1 mt-6"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 380 }}
        style={{ zIndex: 10 }}
      >
        <View className="flex-row flex-wrap justify-between">
          {filteredItems.map((item, index) => (
            <SnackCard 
              key={item.id} 
              item={item} 
              index={index}
              quantity={cart[item.id] || 0}
              onAdd={() => addItem(item.id)}
              onRemove={() => removeItem(item.id)}
              dragX={dragX}
              dragY={dragY}
              isDragging={isDragging}
              dragScale={dragScale}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}
        </View>
      </ScrollView>

      {/* Interactive Snack Tray */}
      {trayItems.length > 0 ? (
        <Animated.View 
          entering={FadeInDown.duration(300)}
          className="absolute left-0 right-0 px-6"
          style={{ bottom: Math.max(insets.bottom + 130, 150), zIndex: 50 }}
        >
          <Animated.View style={[{
            borderRadius: 18,
            borderWidth: 1,
            overflow: 'hidden',
            padding: 8,
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 16,
            elevation: 8,
          }, traySplashStyle]}>
            
            {/* Header of Tray — LTR Alignment & Swapped Order */}
            <View className="items-center justify-between px-1 mb-1.5" style={{ flexDirection: 'row', zIndex: 10 }}>
              {/* Title & Count - Rendered beautifully in LTR style */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text className="text-white font-bold text-[11.5px]">
                  🍿 מגש החטיפים שלך <Text className="text-primary font-bold font-sans">({trayItems.length})</Text>
                </Text>
              </View>
              
              {/* Clear Tray Button */}
              <Pressable 
                onPress={clearCart}
                className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 active:bg-white/10 active:scale-95"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Text className="text-primary font-bold text-[8.5px]">פנה מגש</Text>
                <Trash2 size={9.5} color="#FF1464" />
              </Pressable>
            </View>

            {/* Scrollable Visual Tray Items */}
            <ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row-reverse', gap: 8, paddingVertical: 4, paddingHorizontal: 4 }}
              style={{ zIndex: 10 }}
            >
              {trayItems.map((item) => (
                <TraySnackItem 
                  key={item.key} 
                  item={item} 
                  allSnacks={allSnacks}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </ScrollView>
            
            {/* Ambient Indicator */}
            <Text className="text-[8px] text-white/30 text-center mt-1 font-medium" style={{ zIndex: 10 }}>
              💡 גרור חטיפים לכאן כדי להוסיפם | לחץ על ה-מ׳ האדום כדי להסיר
            </Text>
          </Animated.View>
        </Animated.View>
      ) : (
        <Animated.View 
          entering={FadeInDown.duration(300)}
          className="absolute left-0 right-0 px-6"
          style={{ bottom: Math.max(insets.bottom + 130, 150), zIndex: 50 }}
        >
          <Animated.View 
            style={[pulsingStyle, {
              backgroundColor: '#0a0a0c',
              borderRadius: 16,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              paddingHorizontal: 10,
              paddingVertical: 10,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }]}
          >
            <Text className="text-white/40 text-[10.5px] font-semibold text-center font-sans">
              המגש שלך ריק... גרור לכאן חטיפים! 🍿🥤
            </Text>
          </Animated.View>
        </Animated.View>
      )}

      {/* Floating Checkout Bar */}
      <View className="absolute bottom-0 left-0 right-0" style={{ zIndex: 100 }}>
        <Animated.View entering={FadeInDown.delay(200)}>
          <BlurView 
            intensity={95} 
            tint="dark" 
            className="px-6 pt-6 border-t border-white/10 rounded-t-[40px] overflow-hidden"
            style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}
          >
            <View className="flex-row-reverse items-center justify-between">
              <View className="items-end">
                <Text className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-0.5">סה"כ הזמנה</Text>
                <Text style={{ textAlign: 'right' }}>
                  <Text className="text-h1 text-white font-display">₪{(ticketsTotal + finalSnacksTotal).toFixed(0)}</Text>
                </Text>
                {snacksTotal > 0 && (
                  <View className="items-end mt-0.5">
                    <Text className="text-[10px] text-white/50 font-medium">כולל ₪{snacksTotal} נשנושים</Text>
                    {hasComboDiscount && (
                      <Animated.View 
                        entering={ZoomIn.duration(200)}
                        className="bg-primary/20 px-2 py-0.5 rounded-lg border border-primary/45 mt-0.5"
                      >
                        <Text className="text-[9px] text-primary font-bold">🎉 הנחת קומבו: 10- ₪</Text>
                      </Animated.View>
                    )}
                  </View>
                )}
              </View>

              <Pressable 
                onPress={handleCheckout}
                className="overflow-hidden rounded-3xl active:scale-98"
              >
                <LinearGradient
                  colors={[Colors.primary, '#D40054']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="flex-row-reverse items-center gap-3 px-8 py-4 min-w-[160px] justify-center"
                >
                  <Text className="font-bold text-h3 text-white font-display">
                    המשך לתשלום
                  </Text>
                  <ShoppingCart size={20} color="white" />
                </LinearGradient>
              </Pressable>
            </View>
          </BlurView>
        </Animated.View>
      </View>

      {/* Floating Drag Absolute Preview */}
      {activeDragItem && (
        <Animated.View style={floatingPreviewStyle} pointerEvents="none">
          <Image 
            source={activeDragItem.image}
            className="w-full h-full"
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </View>
  );
}

function SnackCard({ 
  item, 
  index, 
  quantity, 
  onAdd, 
  onRemove,
  dragX,
  dragY,
  isDragging,
  dragScale,
  onDragStart,
  onDragEnd
}: { 
  item: SnackItem, 
  index: number, 
  quantity: number,
  onAdd: () => void,
  onRemove: () => void,
  dragX: SharedValue<number>,
  dragY: SharedValue<number>,
  isDragging: SharedValue<boolean>,
  dragScale: SharedValue<number>,
  onDragStart: (item: SnackItem) => void,
  onDragEnd: (x: number, y: number) => void
}) {
  const localDragX = dragX;
  const localDragY = dragY;
  const localIsDragging = isDragging;
  const localDragScale = dragScale;

  const panGesture = Gesture.Pan()
    .onStart((e) => {
      localDragX.value = e.absoluteX;
      localDragY.value = e.absoluteY;
      localIsDragging.value = true;
      localDragScale.value = 1.25;
      runOnJS(onDragStart)(item);
    })
    .onUpdate((e) => {
      localDragX.value = e.absoluteX;
      localDragY.value = e.absoluteY;
    })
    .onEnd((e) => {
      localDragScale.value = 1.0;
      localIsDragging.value = false;
      runOnJS(onDragEnd)(e.absoluteX, e.absoluteY);
    });

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 50)}
      className="w-[48%] mb-6 rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-lg relative"
      style={{ height: 250 }}
    >
      <View className="relative w-full h-32 overflow-hidden">
        <Image 
          source={item.image}
          className="w-full h-full"
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(18, 18, 20, 0.7)']}
          className="absolute inset-0"
        />

        {/* Floating Glassmorphic Drag Handle overlay */}
        <View className="absolute top-2.5 left-2.5 z-30">
          <GestureDetector gesture={panGesture}>
            <View className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-black/60 border border-white/20 backdrop-blur-md active:scale-90">
              <Grip size={11} color="white" />
              <Text className="text-[9px] text-white font-bold font-sans">גרור</Text>
            </View>
          </GestureDetector>
        </View>
      </View>
      
      <View className="p-4 flex-1 justify-between bg-white/[0.01]">
        <View>
          <Text className="text-white font-display text-base leading-tight" numberOfLines={1}>{item.name}</Text>
          <Text className="text-white/50 text-[11px] mt-0.5 leading-tight font-medium" numberOfLines={2}>{item.description}</Text>
        </View>

        <View className="flex-row-reverse items-center justify-between mt-2">
          <Text className="text-primary font-bold text-lg font-sans">₪{item.price}</Text>
          
          <View className="flex-row-reverse items-center gap-2">
            {quantity > 0 ? (
              <View className="flex-row-reverse items-center gap-2">
                <Pressable 
                  onPress={onRemove}
                  className="w-7 h-7 rounded-full bg-white/10 items-center justify-center border border-white/15 active:bg-white/20 active:scale-95"
                >
                  <Minus size={14} color="white" />
                </Pressable>
                <Text className="text-white font-bold text-sm mx-0.5">{quantity}</Text>
                <Pressable 
                  onPress={onAdd}
                  className="w-7 h-7 rounded-full bg-primary items-center justify-center active:scale-95 shadow-sm" style={{ shadowColor: Colors.primary, shadowOpacity: 0.25 }}
                >
                  <Plus size={14} color="white" />
                </Pressable>
              </View>
            ) : (
              <Pressable 
                onPress={onAdd}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center border border-white/25 active:bg-white/20 active:scale-95"
              >
                <Plus size={16} color="white" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
