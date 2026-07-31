import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';

export interface GourmetBaseOption {
  id: string;
  name: string;
  price: number;
  icon: string;
}

export const GOURMET_BASES: GourmetBaseOption[] = [
  { id: 'truffle_popcorn', name: 'פופקורן כמהין 24K', price: 42, icon: '🍿' },
  { id: 'pretzel_cheese', name: 'פרצל בריוש & גבינות', price: 48, icon: '🥨' },
  { id: 'neon_cocktail', name: 'קוקטייל מולקולרי ניאון', price: 52, icon: '🍸' },
  { id: 'nitrogen_gelato', name: 'גלידת חנקן נוזלי VIP', price: 45, icon: '🍦' },
];

export const GOURMET_TOPPING_ITEMS: { name: string; price: number; color: string }[] = [
  { name: 'אבקת פרמזן כמהין', price: 6, color: '#FACC15' },
  { name: 'קרמל מלוח אטלנטי', price: 6, color: '#F97316' },
  { name: 'צ\'ילי מעושן & ליים', price: 5, color: '#EF4444' },
  { name: 'שבבי שוקולד 70%', price: 6, color: '#A855F7' },
];

interface CineBarCustomizerProps {
  selectedBase: GourmetBaseOption;
  seasoningLevel: number;
  selectedToppings: string[];
  onSelectBase: (base: GourmetBaseOption) => void;
  onSeasoningChange: (val: number) => void;
  onToggleTopping: (topping: string) => void;
}

export const CineBarCustomizer: React.FC<CineBarCustomizerProps> = ({
  selectedBase,
  seasoningLevel,
  selectedToppings,
  onSelectBase,
  onSeasoningChange,
  onToggleTopping,
}) => {
  return (
    <View className="bg-surfaceLight/80 border border-white/10 rounded-[32px] p-5 mb-6 shadow-2xl">
      {/* 1. Gourmet Base Selection */}
      <Text style={{ textAlign: 'left', writingDirection: 'ltr' }} className="text-white text-base font-bold font-display mb-3">
        1. בחר מנת שף VIP
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 10, paddingBottom: 6 }}>
        {GOURMET_BASES.map((base) => {
          const isSelected = selectedBase.id === base.id;
          return (
            <Pressable
              key={base.id}
              onPress={() => {
                Haptics.selectionAsync();
                onSelectBase(base);
              }}
              className={`px-4 py-3 rounded-2xl border flex-row items-center gap-2 ${
                isSelected ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/10'
              }`}
            >
              <Text className="text-base">{base.icon}</Text>
              <View className="items-start">
                <Text style={{ writingDirection: 'ltr' }} className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-white/70'}`}>
                  {base.name}
                </Text>
                <Text className="text-primary text-[10px] font-bold">₪{base.price}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 2. Seasoning Intensity Slider */}
      <View className="flex-row items-center justify-between mt-4 mb-2">
        <Text style={{ textAlign: 'left', writingDirection: 'ltr' }} className="text-white text-base font-bold font-display">
          2. עוצמת תיבול קולינרי
        </Text>
        <View className="bg-primary/20 border border-primary/40 px-3 py-0.5 rounded-full">
          <Text className="text-xs text-primary font-bold">{seasoningLevel}%</Text>
        </View>
      </View>

      <View className="my-2">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-xs text-white/40">עדין (0%)</Text>
          <Text className="text-xs text-white/40">עוצמתי (100%)</Text>
        </View>
        <View className="flex-row justify-between gap-2">
          {[20, 40, 60, 80, 100].map((lvl) => (
            <Pressable
              key={lvl}
              onPress={() => {
                Haptics.selectionAsync();
                onSeasoningChange(lvl);
              }}
              className={`flex-1 py-2 rounded-xl border items-center ${
                seasoningLevel === lvl ? 'bg-primary border-primary' : 'bg-white/5 border-white/10'
              }`}
            >
              <Text className={`text-xs font-bold ${seasoningLevel === lvl ? 'text-white' : 'text-white/50'}`}>{lvl}%</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 3. Gourmet Toppings */}
      <View className="flex-row items-center justify-between mt-5 mb-3">
        <Text style={{ textAlign: 'left', writingDirection: 'ltr' }} className="text-white text-base font-bold font-display">
          3. תוספות & תבליני שף
        </Text>
        <View className="bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-full">
          <Text className="text-[10px] text-white/60 font-medium">+₪5-6 ליחידה</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 justify-start">
        {GOURMET_TOPPING_ITEMS.map((topping) => {
          const isActive = selectedToppings.includes(topping.name);
          return (
            <Pressable
              key={topping.name}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggleTopping(topping.name);
              }}
              className={`px-3.5 py-2.5 rounded-2xl border flex-row items-center gap-1.5 ${
                isActive ? 'bg-secondary/20 border-secondary' : 'bg-white/5 border-white/10'
              }`}
            >
              <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: topping.color }} />
              <Text style={{ writingDirection: 'ltr' }} className={`text-xs ${isActive ? 'text-white font-bold' : 'text-white/70'}`}>
                {topping.name}
              </Text>
              {isActive && <Check size={12} color={Colors.secondary} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
