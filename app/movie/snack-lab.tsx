import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Crown } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { useSnacksStore } from '@/store/useSnacksStore';
import { useBookingStore } from '@/store/useBookingStore';
import { CineBarHeader } from '@/components/snacklab/CineBarHeader';
import { CineBarVisualizer } from '@/components/snacklab/CineBarVisualizer';
import { CineBarCustomizer, GOURMET_BASES, GourmetBaseOption, GOURMET_TOPPING_ITEMS } from '@/components/snacklab/CineBarCustomizer';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w1280';

export default function SnackLabScreen() {
  const insets = useSafeAreaInsets();
  const selectedMoviePoster = useBookingStore(state => state.selectedMoviePoster);
  const addItem = useSnacksStore(state => state.addItem);

  const [selectedBase, setSelectedBase] = useState<GourmetBaseOption>(GOURMET_BASES[0]);
  const [seasoningLevel, setSeasoningLevel] = useState(60);
  const [selectedToppings, setSelectedToppings] = useState<string[]>(['אבקת פרמזן כמהין']);

  const totalPrice = React.useMemo(() => {
    const toppingsCost = selectedToppings.reduce((sum, name) => {
      const found = GOURMET_TOPPING_ITEMS.find(t => t.name === name);
      return sum + (found ? found.price : 5);
    }, 0);
    return selectedBase.price + toppingsCost;
  }, [selectedBase, selectedToppings]);

  const handleToggleTopping = (topping: string) => {
    setSelectedToppings(prev =>
      prev.includes(topping) ? prev.filter(t => t !== topping) : [...prev, topping]
    );
  };

  const handleAddToCart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const customId = `gourmet_vip_${Date.now()}`;
    const toppingsText = selectedToppings.length > 0 ? selectedToppings.join(', ') : 'ללא תוספות';
    const name = `מנת שף - ${selectedBase.name}`;
    const description = `תיבול ${seasoningLevel}%, ${toppingsText}`;

    const newSnackItem = {
      id: customId,
      name,
      description,
      price: totalPrice,
      image: require('../../assets/images/snacks/xl-popcorn.png'),
      category: 'Combos' as const,
    };

    useSnacksStore.setState(state => ({
      items: [newSnackItem, ...state.items]
    }));

    addItem(customId);
    if (router.canGoBack()) router.back();
    else router.push('/movie/snacks' as any);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Background Poster & Blur */}
      <View className="absolute inset-0">
        {selectedMoviePoster && (
          <Image source={{ uri: `${TMDB_IMAGE_BASE}${selectedMoviePoster}` }} className="w-full h-full" resizeMode="cover" />
        )}
        <BlurView intensity={100} tint="dark" className="absolute inset-0" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)', Colors.background]} className="absolute inset-0" />
      </View>

      {/* Header */}
      <View style={{ paddingTop: insets.top }}>
        <CineBarHeader onBack={() => router.back()} />
      </View>

      <ScrollView className="flex-1 px-6 mt-2" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* VIP Gourmet Presentation Visualizer */}
        <CineBarVisualizer
          selectedBase={selectedBase.name}
          seasoningLevel={seasoningLevel}
          toppingsCount={selectedToppings.length}
        />

        {/* VIP Chef Customizer */}
        <CineBarCustomizer
          selectedBase={selectedBase}
          seasoningLevel={seasoningLevel}
          selectedToppings={selectedToppings}
          onSelectBase={setSelectedBase}
          onSeasoningChange={setSeasoningLevel}
          onToggleTopping={handleToggleTopping}
        />
      </ScrollView>

      {/* Footer Checkout CTA (LTR) */}
      <BlurView intensity={95} tint="dark" className="px-6 py-5 border-t border-white/10 rounded-t-[36px]" style={{ paddingBottom: Math.max(insets.bottom + 12, 28) }}>
        <View className="flex-row items-center justify-between">
          <View className="items-start">
            <Text style={{ writingDirection: 'ltr' }} className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-0.5">מחיר מנת שף VIP</Text>
            <Text className="text-2xl text-white font-bold font-display">₪{totalPrice.toFixed(0)}</Text>
          </View>

          <Pressable onPress={handleAddToCart} className="overflow-hidden rounded-2xl active:scale-98">
            <LinearGradient colors={[Colors.primary, '#D40054']} className="flex-row items-center gap-2.5 px-8 py-3.5 justify-center">
              <Crown size={18} color="white" />
              <Text style={{ writingDirection: 'ltr' }} className="font-bold text-white text-sm font-display">הוסף מנת שף לסל 🍷</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}
