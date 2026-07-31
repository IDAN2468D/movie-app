import React from 'react';
import { View, Text, Pressable, I18nManager } from 'react-native';
import { ChevronRight, ChevronLeft, Sparkles, MapPin, ShoppingBag } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';

interface CineDineHeaderProps {
  deliveryMode: 'seat' | 'counter';
  onToggleDeliveryMode: (mode: 'seat' | 'counter') => void;
  onOpenSnackLab: () => void;
}

export const CineDineHeader: React.FC<CineDineHeaderProps> = ({
  deliveryMode,
  onToggleDeliveryMode,
  onOpenSnackLab,
}) => {
  return (
    <View className="px-6 pb-2 pt-2 gap-3 z-20">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (router.canGoBack()) router.back();
            else router.push('/(tabs)' as any);
          }}
          className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 justify-center items-center active:scale-95"
        >
          {I18nManager.isRTL ? <ChevronRight size={22} color="white" /> : <ChevronLeft size={22} color="white" />}
        </Pressable>

        <View className="flex-1 items-end mx-3">
          <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-xl font-bold font-display">
            CineDine VIP מזנון 4.0
          </Text>
          <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/50 text-xs font-medium">
            הזמנת נשנושים ומשלוח בלייב למושב
          </Text>
        </View>

        <Pressable
          onPress={onOpenSnackLab}
          className="px-3 py-2 rounded-2xl bg-secondary/15 border border-secondary/35 flex-row items-center gap-1.5 active:scale-95"
        >
          <Sparkles size={14} color={Colors.secondary} />
          <Text className="font-bold text-secondary text-xs font-sans">מעבדה 🧪</Text>
        </Pressable>
      </View>

      {/* Delivery Mode Toggle Pill */}
      <View className="flex-row bg-black/50 p-1 rounded-2xl border border-white/10">
        <Pressable
          onPress={() => onToggleDeliveryMode('seat')}
          className={`flex-1 py-2 rounded-xl flex-row items-center justify-center gap-1.5 ${
            deliveryMode === 'seat' ? 'bg-primary' : 'bg-transparent'
          }`}
        >
          <MapPin size={13} color="white" />
          <Text style={{ writingDirection: 'rtl' }} className={`text-xs font-bold ${deliveryMode === 'seat' ? 'text-white' : 'text-white/60'}`}>
            משלוח לכיסא באולם
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onToggleDeliveryMode('counter')}
          className={`flex-1 py-2 rounded-xl flex-row items-center justify-center gap-1.5 ${
            deliveryMode === 'counter' ? 'bg-primary' : 'bg-transparent'
          }`}
        >
          <ShoppingBag size={13} color="white" />
          <Text style={{ writingDirection: 'rtl' }} className={`text-xs font-bold ${deliveryMode === 'counter' ? 'text-white' : 'text-white/60'}`}>
            איסוף מהיר בדלפק VIP
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
