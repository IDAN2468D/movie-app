import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '@/constants/Theme';
import { useSnacksStore, SnackItem } from '@/store/useSnacksStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useCineSnacksAIStore } from '@/store/useCineSnacksAIStore';
import { useSnacks } from '@/hooks/useSnacks';
import { CineDineHeader } from '@/components/snacks/CineDineHeader';
import { CineMealAICard } from '@/components/snacks/CineMealAICard';
import { SnackCardItem } from '@/components/snacks/SnackCardItem';
import { CineDineCartTray } from '@/components/snacks/CineDineCartTray';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w1280';

export default function SnacksScreen() {
  const insets = useSafeAreaInsets();
  const [deliveryMode, setDeliveryMode] = useState<'seat' | 'counter'>('seat');

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
  } = useSnacks();

  const allSnacks = useSnacksStore(state => state.items);
  const fetchSnacks = useSnacksStore(state => state.fetchSnacks);
  const movieTitle = useBookingStore(state => state.selectedMovieTitle);
  const showtime = useBookingStore(state => state.selectedShowtime);
  const { recommendedIds, isLoading: isRecLoading, fetchRecommendations } = useCineSnacksAIStore();

  useEffect(() => {
    fetchSnacks();
    if (movieTitle) {
      fetchRecommendations(movieTitle, undefined, showtime?.format, showtime?.time);
    }
  }, [movieTitle, showtime]);

  const recommendedSnacks = useMemo(() => {
    return recommendedIds.map(id => allSnacks.find(s => s.id === id)).filter(Boolean) as SnackItem[];
  }, [recommendedIds, allSnacks]);

  const handleAddAllAI = () => {
    recommendedSnacks.forEach(snack => addItem(snack.id));
  };

  return (
    <View className="flex-1 bg-background">
      {/* Background Poster & Blur */}
      <View className="absolute inset-0">
        {selectedMoviePoster && (
          <Image source={{ uri: `${TMDB_IMAGE_BASE}${selectedMoviePoster}` }} className="w-full h-full" resizeMode="cover" />
        )}
        <BlurView intensity={100} tint="dark" className="absolute inset-0" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)', Colors.background]} className="absolute inset-0" />
      </View>

      {/* Header & Delivery Selector */}
      <View style={{ paddingTop: insets.top }}>
        <CineDineHeader
          deliveryMode={deliveryMode}
          onToggleDeliveryMode={setDeliveryMode}
          onOpenSnackLab={() => router.push('/movie/snack-lab' as any)}
        />
      </View>

      {/* Categories Bar */}
      <View className="mt-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row-reverse', paddingHorizontal: 24, gap: 10 }}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const label = cat === 'All' ? 'הכל' : cat === 'Popcorn' ? 'פופקורן' : cat === 'Drinks' ? 'שתייה' : cat === 'Combos' ? 'דילים' : 'מתוקים';
            return (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                className={`px-5 py-2 rounded-xl ${isActive ? 'bg-primary border border-primary' : 'bg-white/5 border border-white/10'}`}
              >
                <Text style={{ writingDirection: 'rtl' }} className={`font-bold text-xs ${isActive ? 'text-white' : 'text-white/60'}`}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* CineMeal AI Card */}
      <CineMealAICard
        movieTitle={movieTitle}
        isLoading={isRecLoading}
        recommendedSnacks={recommendedSnacks}
        onAddAll={handleAddAllAI}
      />

      {/* Snacks Grid */}
      <ScrollView className="flex-1 mt-4" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 220 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between">
          {filteredItems.map((item, index) => (
            <SnackCardItem
              key={item.id}
              item={item}
              index={index}
              quantity={cart[item.id] || 0}
              onAdd={() => addItem(item.id)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Cart Tray & Checkout Footer */}
      <CineDineCartTray
        cart={cart}
        allSnacks={allSnacks}
        snacksTotal={snacksTotal}
        ticketsTotal={ticketsTotal}
        deliveryMode={deliveryMode}
        insetsBottom={insets.bottom}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
      />
    </View>
  );
}
