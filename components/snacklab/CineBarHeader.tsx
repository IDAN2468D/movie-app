import React from 'react';
import { View, Text, Pressable, I18nManager } from 'react-native';
import { ChevronRight, ChevronLeft, Crown, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';

interface CineBarHeaderProps {
  onBack: () => void;
}

export const CineBarHeader: React.FC<CineBarHeaderProps> = ({ onBack }) => {
  return (
    <View className="px-6 pb-2 pt-2 flex-row items-center justify-between z-20">
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onBack();
        }}
        className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 justify-center items-center active:scale-95"
      >
        {I18nManager.isRTL ? <ChevronRight size={22} color="white" /> : <ChevronLeft size={22} color="white" />}
      </Pressable>

      <View className="flex-1 items-start mx-3">
        <View className="flex-row items-center gap-1.5 justify-start">
          <Crown size={18} color={Colors.secondary} />
          <Text style={{ textAlign: 'left', writingDirection: 'ltr' }} className="text-white text-xl font-bold font-display">
            מזנון שף VIP & מיקסולוגיה
          </Text>
        </View>
        <Text style={{ textAlign: 'left', writingDirection: 'ltr' }} className="text-white/50 text-xs font-medium">
          חוויית קולינריה קולנועית בהרכבה אישית
        </Text>
      </View>

      <View className="w-10 h-10 rounded-2xl bg-secondary/15 border border-secondary/30 items-center justify-center">
        <Sparkles size={18} color={Colors.secondary} />
      </View>
    </View>
  );
};
