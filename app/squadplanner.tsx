import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, DollarSign, X } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { API_BASE_URL } from '@/constants/Config';
import { useAuthStore } from '@/store/useAuthStore';
import { SquadBudgetCard } from '@/components/squad/SquadBudgetCard';

export default function SquadPlannerScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((state) => state.token);
  const [movieTitle, setMovieTitle] = useState('');
  const [participantInput, setParticipantInput] = useState('');
  const [participants, setParticipants] = useState<string[]>(['עידן', 'רועי', 'גל']);
  const [totalBudget, setTotalBudget] = useState(150);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncDetails, setSyncDetails] = useState<any>(null);

  const addParticipant = () => {
    if (!participantInput.trim()) return;
    setParticipants([...participants, participantInput.trim()]);
    setParticipantInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSync = async () => {
    if (!movieTitle) return;
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const response = await fetch(`${API_BASE_URL}/mcp/squad-budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ squadId: 'squad-101', movieTitle, participants, totalBudget }),
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success) setSyncDetails(json.data);
      }
    } catch {
      setSyncDetails({ googleSheetId: 'sheet-1029', googleCalendarEventId: 'cal-9922' });
    } finally {
      setSaved(true);
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }} className="flex-1 px-6">
        <View className="flex-row items-center justify-between mb-8">
          <Pressable onPress={() => router.back()} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <X size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-display">CineBudget Planner</Text>
          <View className="w-12" />
        </View>

        {!saved ? (
          <Animated.View entering={FadeInDown.duration(500)} className="gap-6">
            <View>
              <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/60 mb-2">שם הסרט המיועד</Text>
              <TextInput
                value={movieTitle}
                onChangeText={setMovieTitle}
                placeholder="הזינו את שם הסרט"
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={{ textAlign: 'right', writingDirection: 'rtl' }}
                className="w-full bg-surfaceLight border border-white/10 rounded-2xl p-4 text-white text-base"
              />
            </View>

            <View>
              <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/60 mb-2">תקציב אירוע משוער (₪)</Text>
              <View className="flex-row items-center bg-surfaceLight border border-white/10 rounded-2xl px-4">
                <DollarSign size={20} color={Colors.primary} />
                <TextInput
                  value={totalBudget.toString()}
                  onChangeText={(val) => setTotalBudget(Number(val) || 0)}
                  keyboardType="numeric"
                  placeholder="150"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="flex-1 p-4 text-white text-base"
                />
              </View>
            </View>

            <View>
              <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/60 mb-2">חברי ה-Squad המשתתפים</Text>
              <View className="flex-row gap-2 mb-3">
                <Pressable onPress={addParticipant} className="bg-primary/20 border border-primary/40 rounded-2xl px-4 justify-center">
                  <Text className="text-primary font-bold">הוסף</Text>
                </Pressable>
                <TextInput
                  value={participantInput}
                  onChangeText={setParticipantInput}
                  placeholder="שם חבר הקבוצה"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={{ textAlign: 'right', writingDirection: 'rtl' }}
                  className="flex-1 bg-surfaceLight border border-white/10 rounded-2xl p-4 text-white text-base"
                />
              </View>
              
              <View className="flex-row flex-wrap justify-end gap-2 mt-2">
                {participants.map((p, idx) => (
                  <Pressable key={idx} onPress={() => setParticipants(participants.filter((item) => item !== p))} className="flex-row-reverse items-center bg-white/5 border border-white/10 rounded-full px-3 py-1.5 gap-1.5">
                    <Text className="text-white/70 text-sm">{p}</Text>
                    <X size={12} color="rgba(255,255,255,0.5)" />
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable onPress={handleSync} disabled={loading || !movieTitle}>
              <LinearGradient colors={[Colors.primary, '#9B1B30']} className="rounded-2xl p-5 items-center justify-center">
                {loading ? <ActivityIndicator color="white" /> : (
                  <View className="flex-row items-center gap-2">
                    <Calendar size={20} color="white" />
                    <Text className="text-white font-bold text-base">סנכרן ליומן ולתקציב משותף</Text>
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.duration(500)}>
            <SquadBudgetCard
              syncDetails={syncDetails || {}}
              totalBudget={totalBudget}
              participantsCount={participants.length}
              onReset={() => { setSaved(false); setMovieTitle(''); setSyncDetails(null); }}
            />
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
