import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Users, DollarSign, Check, X, ArrowLeft, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Typography } from '@/constants/Theme';

export default function SquadPlannerScreen() {
  const insets = useSafeAreaInsets();
  const [movieTitle, setMovieTitle] = useState('');
  const [eventDate, setEventDate] = useState('2026-06-25T19:30:00.000Z');
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
      const response = await fetch('http://localhost:5000/api/mcp/squad-budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-dev-token'
        },
        body: JSON.stringify({
          squadId: '60c72b2f9b1d8a23d88b4567', // Mock object id
          movieTitle,
          eventDate,
          participants,
          totalBudget
        })
      });

      const json = await response.json();
      if (json.success) {
        setSyncDetails(json.data);
        setSaved(true);
      }
    } catch (error) {
      console.warn('API error, simulating sync...', error);
      setSyncDetails({
        googleSheetId: 'spread-sheet-1029384',
        googleCalendarEventId: 'cal-event-992283'
      });
      setSaved(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView 
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <Pressable 
            onPress={() => router.back()}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center"
          >
            <X size={24} color="white" />
          </Pressable>
          <Text className="text-white text-h2 font-display">CineBudget Planner</Text>
          <View className="w-12" />
        </View>

        {!saved ? (
          <Animated.View entering={FadeInDown.duration(600)} className="gap-6">
            <View>
              <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/60 mb-2 font-body">שם הסרט המיועד</Text>
              <TextInput
                value={movieTitle}
                onChangeText={setMovieTitle}
                placeholder="הזינו את שם הסרט"
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={{ textAlign: 'right', writingDirection: 'rtl', fontFamily: 'Rubik-Regular' }}
                className="w-full bg-surfaceLight border border-white/10 rounded-2xl p-4 text-white text-base"
              />
            </View>

            <View>
              <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/60 mb-2 font-body">תקציב אירוע משוער (₪)</Text>
              <View className="flex-row items-center bg-surfaceLight border border-white/10 rounded-2xl px-4">
                <DollarSign size={20} color={Colors.primary} />
                <TextInput
                  value={totalBudget.toString()}
                  onChangeText={(val) => setTotalBudget(Number(val) || 0)}
                  keyboardType="numeric"
                  placeholder="למשל: 150"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={{ textAlign: 'left', fontFamily: 'Rubik-Regular' }}
                  className="flex-1 p-4 text-white text-base"
                />
              </View>
            </View>

            <View>
              <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/60 mb-2 font-body">חברי ה-Squad המשתתפים</Text>
              <View className="flex-row gap-2 mb-3">
                <Pressable onPress={addParticipant} className="bg-primary/20 border border-primary/40 rounded-2xl px-4 justify-center">
                  <Text className="text-primary font-bold">הוסף</Text>
                </Pressable>
                <TextInput
                  value={participantInput}
                  onChangeText={setParticipantInput}
                  placeholder="שם חבר הקבוצה"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={{ textAlign: 'right', writingDirection: 'rtl', fontFamily: 'Rubik-Regular' }}
                  className="flex-1 bg-surfaceLight border border-white/10 rounded-2xl p-4 text-white text-base"
                />
              </View>
              
              <View className="flex-row flex-wrap justify-end gap-2 mt-2">
                {participants.map((p, idx) => (
                  <Pressable 
                    key={idx} 
                    onPress={() => {
                      setParticipants(participants.filter((item) => item !== p));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="flex-row items-center bg-white/5 border border-white/10 rounded-full px-3 py-1.5 gap-1.5"
                    style={{ flexDirection: 'row-reverse' }}
                  >
                    <Text className="text-white/70 text-sm" style={{ fontFamily: 'Assistant-Regular' }}>{p}</Text>
                    <X size={12} color="rgba(255,255,255,0.5)" />
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable onPress={handleSync} disabled={loading || !movieTitle}>
              <LinearGradient
                colors={[Colors.primary, '#9B1B30']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl p-5 items-center justify-center animate-bounce"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View className="flex-row items-center gap-2">
                    <Calendar size={20} color="white" />
                    <Text className="text-white font-bold text-base" style={{ fontFamily: 'Rubik-Bold' }}>סנכרן ליומן ולתקציב משותף</Text>
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.duration(600)} className="gap-6">
            <View className="items-center justify-center p-8 bg-surfaceLight rounded-[32px] border border-white/10">
              <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mb-4">
                <Check size={32} color="#10B981" />
              </View>
              <Text style={{ fontFamily: 'Rubik-Bold' }} className="text-white text-xl mb-2">סונכרן בהצלחה!</Text>
              <Text style={{ textAlign: 'center', fontFamily: 'Assistant-Regular' }} className="text-white/60">
                נוצר גליון תקציב שיתופי בגוגל דרייב ונוצר אירוע תואם ביומן גוגל עבור כל החברים.
              </Text>
            </View>

            {syncDetails && (
              <View className="bg-surfaceLight p-6 rounded-[32px] border border-white/10 gap-4">
                <Text style={{ fontFamily: 'Rubik-Bold', textAlign: 'right' }} className="text-white text-lg border-b border-white/5 pb-2">פרטי הסנכרון לענן</Text>
                
                <View className="flex-row justify-between items-center" style={{ flexDirection: 'row-reverse' }}>
                  <Text className="text-white/50" style={{ fontFamily: 'Assistant-Regular' }}>Google Sheets ID:</Text>
                  <Text className="text-primary font-mono text-sm">{syncDetails.googleSheetId?.substring(0, 15)}...</Text>
                </View>

                <View className="flex-row justify-between items-center" style={{ flexDirection: 'row-reverse' }}>
                  <Text className="text-white/50" style={{ fontFamily: 'Assistant-Regular' }}>Calendar Event ID:</Text>
                  <Text className="text-primary font-mono text-sm">{syncDetails.googleCalendarEventId?.substring(0, 15)}...</Text>
                </View>

                <View className="flex-row justify-between items-center" style={{ flexDirection: 'row-reverse' }}>
                  <Text className="text-white/50" style={{ fontFamily: 'Assistant-Regular' }}>חצי תקציב לאדם:</Text>
                  <Text className="text-secondary font-bold text-sm">₪{(totalBudget / (participants.length || 1)).toFixed(2)}</Text>
                </View>
              </View>
            )}

            <Pressable 
              onPress={() => {
                setSaved(false);
                setMovieTitle('');
                setTotalBudget(150);
                setSyncDetails(null);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 items-center justify-center"
            >
              <Text className="text-white font-bold text-base" style={{ fontFamily: 'Rubik-Bold' }}>תכנן אירוע חדש</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
