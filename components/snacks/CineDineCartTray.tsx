import React from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { ShoppingCart, Trash2, MapPin } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { SnackItem } from '@/store/useSnacksStore';

interface CineDineCartTrayProps {
  cart: Record<string, number>;
  allSnacks: SnackItem[];
  snacksTotal: number;
  ticketsTotal: number;
  deliveryMode: 'seat' | 'counter';
  insetsBottom: number;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export const CineDineCartTray: React.FC<CineDineCartTrayProps> = ({
  cart,
  allSnacks,
  snacksTotal,
  ticketsTotal,
  deliveryMode,
  insetsBottom,
  onRemoveItem,
  onClearCart,
  onCheckout,
}) => {
  const trayItems = React.useMemo(() => {
    const list: { id: string; key: string; name: string; image: any }[] = [];
    Object.entries(cart).forEach(([id, quantity]) => {
      const item = allSnacks.find(i => i.id === id);
      if (item) {
        for (let i = 0; i < quantity; i++) {
          list.push({ id, key: `${id}-${i}`, name: item.name, image: item.image });
        }
      }
    });
    return list;
  }, [cart, allSnacks]);

  const finalTotal = ticketsTotal + snacksTotal;

  return (
    <View className="absolute bottom-0 left-0 right-0 z-50">
      {trayItems.length > 0 && (
        <Animated.View entering={FadeInDown.duration(300)} className="px-6 mb-3">
          <View className="bg-surfaceLight/95 border border-primary/30 p-3 rounded-2xl shadow-xl">
            <View className="flex-row-reverse items-center justify-between mb-2">
              <View className="flex-row-reverse items-center gap-1.5">
                <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white font-bold text-xs">
                  🍿 מגש הנשנושים שלך ({trayItems.length})
                </Text>
                {deliveryMode === 'seat' && (
                  <View className="bg-primary/20 border border-primary/40 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                    <MapPin size={9} color={Colors.primary} />
                    <Text className="text-primary text-[9px] font-bold">כיסא F12</Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClearCart();
                }}
                className="flex-row items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10"
              >
                <Text className="text-primary text-[10px] font-bold">פנה מגש</Text>
                <Trash2 size={10} color={Colors.primary} />
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row-reverse', gap: 8 }}>
              {trayItems.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onRemoveItem(item.id);
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 border border-white/15 p-1 items-center justify-center relative active:scale-90"
                >
                  <Image source={item.image} className="w-full h-full rounded-full" resizeMode="contain" />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      )}

      {/* Floating Checkout Bar */}
      <BlurView intensity={95} tint="dark" className="px-6 pt-5 pb-6 border-t border-white/10 rounded-t-[36px]" style={{ paddingBottom: Math.max(insetsBottom + 12, 28) }}>
        <View className="flex-row-reverse items-center justify-between">
          <View className="items-end">
            <Text className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-0.5">סה"כ לתשלום</Text>
            <Text className="text-2xl text-white font-bold font-display">₪{finalTotal.toFixed(0)}</Text>
            {snacksTotal > 0 && <Text className="text-[10px] text-white/50 font-medium">כולל ₪{snacksTotal} מזנון</Text>}
          </View>

          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onCheckout();
            }}
            className="overflow-hidden rounded-2xl active:scale-98"
          >
            <LinearGradient colors={[Colors.primary, '#D40054']} className="flex-row-reverse items-center gap-2.5 px-7 py-3.5 justify-center">
              <Text className="font-bold text-white text-sm font-display">המשך לתשלום</Text>
              <ShoppingCart size={18} color="white" />
            </LinearGradient>
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
};
