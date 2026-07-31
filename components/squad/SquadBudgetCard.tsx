import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check, Calendar } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';

interface SquadBudgetCardProps {
  syncDetails: { googleSheetId?: string; googleCalendarEventId?: string };
  totalBudget: number;
  participantsCount: number;
  onReset: () => void;
}

export function SquadBudgetCard({ syncDetails, totalBudget, participantsCount, onReset }: SquadBudgetCardProps) {
  const perPerson = (totalBudget / (participantsCount || 1)).toFixed(2);

  return (
    <View className="gap-6">
      <View className="items-center justify-center p-8 bg-surfaceLight rounded-[32px] border border-white/10">
        <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mb-4">
          <Check size={32} color="#10B981" />
        </View>
        <Text className="text-white text-xl font-bold mb-2">סונכרן בהצלחה!</Text>
        <Text style={{ textAlign: 'center' }} className="text-white/60 text-sm">
          נוצר גליון תקציב שיתופי בגוגל דרייב ונוצר אירוע תואם ביומן גוגל.
        </Text>
      </View>

      <View className="bg-surfaceLight p-6 rounded-[32px] border border-white/10 gap-4">
        <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-lg font-bold border-b border-white/5 pb-2">פרטי הסנכרון לענן</Text>

        <View className="flex-row justify-between items-center" style={{ flexDirection: 'row-reverse' }}>
          <Text className="text-white/50 text-sm">Google Sheets ID:</Text>
          <Text className="text-primary font-mono text-sm">{syncDetails.googleSheetId?.substring(0, 15)}...</Text>
        </View>

        <View className="flex-row justify-between items-center" style={{ flexDirection: 'row-reverse' }}>
          <Text className="text-white/50 text-sm">חלק לאדם:</Text>
          <Text className="text-secondary font-bold text-sm">₪{perPerson}</Text>
        </View>
      </View>

      <Pressable onPress={onReset} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 items-center justify-center">
        <Text className="text-white font-bold text-base">תכנן אירוע חדש</Text>
      </Pressable>
    </View>
  );
}
