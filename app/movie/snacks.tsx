import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronRight, ShoppingCart, Plus, Minus } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { SnackItem } from '@/store/useSnacksStore';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSnacks } from '@/hooks/useSnacks';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

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
    goBack,
  } = useSnacks();

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
        className="flex-row-reverse items-center px-6 pb-4 pt-2 gap-4 z-20"
        style={{ marginTop: insets.top }}
      >
        <Pressable 
          onPress={goBack} 
          className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 justify-center items-center"
        >
          <ChevronRight size={24} color="white" />
        </Pressable>
        
        <View className="flex-1 items-end">
          <Text className="text-h2 text-white font-display text-right leading-tight">נשנושים לסרט</Text>
          <Text className="text-caption text-white/50 font-medium">השלם את החוויה הקולנועית שלך</Text>
        </View>
      </View>

      {/* Categories */}
      <View className="z-20 mt-4">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ flexDirection: 'row-reverse', paddingHorizontal: 24, gap: 12 }}
        >
          {categories.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              className={`px-6 py-2.5 rounded-2xl border ${
                activeCategory === cat 
                  ? 'bg-primary border-primary' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <Text className={`font-bold ${activeCategory === cat ? 'text-white' : 'text-white/40'}`}>
                {cat === 'All' ? 'הכל' : 
                 cat === 'Popcorn' ? 'פופקורן' : 
                 cat === 'Drinks' ? 'שתייה' : 
                 cat === 'Combos' ? 'דילים' : 'מתוקים'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Snacks Grid */}
      <ScrollView 
        className="flex-1 z-10 mt-6"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 160 }}
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
            />
          ))}
        </View>
      </ScrollView>

      {/* Floating Checkout Bar */}
      <View className="absolute bottom-0 left-0 right-0 z-30">
        <Animated.View entering={FadeInDown.delay(200)}>
          <BlurView 
            intensity={90} 
            tint="dark" 
            className="px-6 pt-6 border-t border-white/10 rounded-t-[40px] overflow-hidden"
            style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}
          >
            <View className="flex-row-reverse items-center justify-between">
              <View className="items-end">
                <Text className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-0.5">סה"כ הזמנה</Text>
                <Text style={{ textAlign: 'right' }}>
                  <Text className="text-h1 text-white font-display">₪{(ticketsTotal + snacksTotal).toFixed(0)}</Text>
                </Text>
                {snacksTotal > 0 && (
                  <Text className="text-[10px] text-primary font-medium">כולל ₪{snacksTotal} נשנושים</Text>
                )}
              </View>

              <Pressable 
                onPress={handleCheckout}
                className="overflow-hidden rounded-3xl"
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
    </View>
  );
}

function SnackCard({ item, index, quantity, onAdd, onRemove }: { 
  item: SnackItem, 
  index: number, 
  quantity: number,
  onAdd: () => void,
  onRemove: () => void
}) {
  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 50)}
      className="w-[48%] mb-6 rounded-[32px] overflow-hidden bg-white/5 border border-white/10"
      style={{ height: 240 }}
    >
      <Image 
        source={{ uri: item.image }}
        className="w-full h-32"
        resizeMode="cover"
      />
      
      <View className="p-4 flex-1 justify-between">
        <View>
          <Text className="text-white font-display text-base leading-tight" numberOfLines={1}>{item.name}</Text>
          <Text className="text-white/40 text-[10px] mt-1" numberOfLines={2}>{item.description}</Text>
        </View>

        <View className="flex-row-reverse items-center justify-between mt-2">
          <Text className="text-primary font-bold text-lg">₪{item.price}</Text>
          
          <View className="flex-row-reverse items-center gap-2">
            {quantity > 0 ? (
              <>
                <Pressable 
                  onPress={onRemove}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center border border-white/20"
                >
                  <Minus size={16} color="white" />
                </Pressable>
                <Text className="text-white font-bold">{quantity}</Text>
                <Pressable 
                  onPress={onAdd}
                  className="w-8 h-8 rounded-full bg-primary items-center justify-center"
                >
                  <Plus size={16} color="white" />
                </Pressable>
              </>
            ) : (
              <Pressable 
                onPress={onAdd}
                className="w-10 h-10 rounded-2xl bg-white/10 items-center justify-center border border-white/20"
              >
                <Plus size={20} color="white" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
