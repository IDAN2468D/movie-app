import React from 'react';
import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { SnackItem } from '@/store/useSnacksStore';

interface CineMealAICardProps {
  movieTitle?: string;
  isLoading: boolean;
  recommendedSnacks: SnackItem[];
  onAddAll: () => void;
}

export const CineMealAICard: React.FC<CineMealAICardProps> = ({
  movieTitle,
  isLoading,
  recommendedSnacks,
  onAddAll,
}) => {
  const totalRecPrice = React.useMemo(() => {
    return recommendedSnacks.reduce((sum, s) => sum + s.price, 0);
  }, [recommendedSnacks]);

  if (!movieTitle) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      className="mx-6 mt-3 rounded-3xl border border-white/10 overflow-hidden bg-surfaceLight/90 p-4"
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2.5 flex-1">
          <View className="w-8 h-8 rounded-xl bg-secondary/15 border border-secondary/30 items-center justify-center">
            <Sparkles size={16} color={Colors.secondary} />
          </View>
          <View className="items-start flex-1">
            <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white font-bold text-xs font-sans">
              CineMeal AI 4.0 Bundle
            </Text>
            <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/40 text-[10px]">
              מארז AI מותאם לסרט {movieTitle}
            </Text>
          </View>
        </View>

        <View className="bg-primary/20 border border-primary/40 px-2 py-0.5 rounded-full">
          <Text className="text-primary text-[9px] font-bold">15% הנחה 🔥</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.secondary} className="my-2" />
      ) : (
        <View className="gap-3">
          <View className="flex-row flex-wrap gap-2 justify-start">
            {recommendedSnacks.map((snack, idx) => (
              <Animated.View
                key={snack.id}
                entering={ZoomIn.delay(idx * 40)}
                className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10"
              >
                {snack.image && <Image source={snack.image} className="w-5 h-5" resizeMode="contain" />}
                <Text style={{ writingDirection: 'rtl' }} className="text-white text-[11px] font-bold font-assistant">{snack.name}</Text>
              </Animated.View>
            ))}
          </View>

          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onAddAll();
            }}
            className="w-full rounded-2xl overflow-hidden active:scale-98"
          >
            <LinearGradient
              colors={[Colors.secondary, '#B8CC00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-2.5 flex-row items-center justify-center gap-2"
            >
              <Sparkles size={14} color={Colors.background} />
              <Text className="font-bold text-background text-xs font-sans">
                ₪{totalRecPrice} • הוסף מארז AI בלחיצה אחת
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
};
