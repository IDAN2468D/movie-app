import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Plus, Minus, Flame } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { SnackItem } from '@/store/useSnacksStore';

interface SnackCardItemProps {
  item: SnackItem;
  index: number;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export const SnackCardItem: React.FC<SnackCardItemProps> = ({
  item,
  index,
  quantity,
  onAdd,
  onRemove,
}) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40)}
      className="w-[48%] mb-5 rounded-3xl overflow-hidden bg-surfaceLight border border-white/10 relative"
      style={{ height: 240 }}
    >
      <View className="relative w-full h-28 overflow-hidden bg-black/40">
        <Image
          source={item.image}
          className="w-full h-full"
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(18, 18, 20, 0.95)']}
          className="absolute inset-0"
        />

        {item.category === 'Combos' && (
          <View className="absolute top-2.5 right-2.5 bg-primary px-2 py-0.5 rounded-full flex-row items-center gap-1">
            <Flame size={10} color="white" />
            <Text className="text-white text-[9px] font-bold">HOT</Text>
          </View>
        )}
      </View>

      <View className="p-3.5 flex-1 justify-between">
        <View>
          <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white font-bold text-sm font-display" numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/50 text-[10px] mt-0.5 leading-tight" numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        <View className="flex-row-reverse items-center justify-between mt-1">
          <Text className="text-primary font-bold text-base font-sans">₪{item.price}</Text>

          <View className="flex-row-reverse items-center gap-2">
            {quantity > 0 ? (
              <View className="flex-row-reverse items-center gap-1.5">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onRemove();
                  }}
                  className="w-7 h-7 rounded-full bg-white/10 items-center justify-center border border-white/15 active:scale-95"
                >
                  <Minus size={13} color="white" />
                </Pressable>
                <Text className="text-white font-bold text-xs mx-0.5">{quantity}</Text>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onAdd();
                  }}
                  className="w-7 h-7 rounded-full bg-primary items-center justify-center active:scale-95"
                >
                  <Plus size={13} color="white" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onAdd();
                }}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center border border-white/20 active:scale-95"
              >
                <Plus size={15} color="white" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};
