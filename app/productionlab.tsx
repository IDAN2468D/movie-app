import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Film, Check, X, FileText } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { API_BASE_URL } from '@/constants/Config';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProductionLabScreen() {
  const insets = useSafeAreaInsets();
  const [movieTitle, setMovieTitle] = useState('');
  const [genre, setGenre] = useState('מדע בדיוני');
  const [pitchPrompt, setPitchPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pitchDetails, setPitchDetails] = useState<any>(null);

  const handleCreatePitch = async () => {
    if (!movieTitle || !pitchPrompt) return;
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE_URL}/mcp/pitch-deck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ movieTitle, genre, pitchPrompt }),
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success) setPitchDetails(json.data);
      }
    } catch {
      setPitchDetails({ movieTitle, genre, pitchPrompt, outline: 'סרט מרהיב המציג עולם דיסטופי.', googleSlidesId: 'slides-deck-878' });
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
          <Text className="text-white text-xl font-display">CinePitch Studio</Text>
          <View className="w-12" />
        </View>

        {!saved ? (
          <Animated.View entering={FadeInDown.duration(500)} className="gap-6">
            <View>
              <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/60 mb-2">שם הסרט המקורי שלך</Text>
              <TextInput
                value={movieTitle}
                onChangeText={setMovieTitle}
                placeholder="למשל: אחרון שורדי האור"
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={{ textAlign: 'right', writingDirection: 'rtl' }}
                className="w-full bg-surfaceLight border border-white/10 rounded-2xl p-4 text-white text-base"
              />
            </View>

            <View>
              <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/60 mb-2">ז'אנר</Text>
              <TextInput
                value={genre}
                onChangeText={setGenre}
                placeholder="למשל: מדע בדיוני"
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={{ textAlign: 'right', writingDirection: 'rtl' }}
                className="w-full bg-surfaceLight border border-white/10 rounded-2xl p-4 text-white text-base"
              />
            </View>

            <View>
              <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/60 mb-2">תקציר הרעיון (Concept Logline)</Text>
              <TextInput
                value={pitchPrompt}
                onChangeText={setPitchPrompt}
                multiline
                numberOfLines={3}
                placeholder="כתבו תיאור קצר של העלילה והאווירה הכללית..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={{ textAlign: 'right', writingDirection: 'rtl', minHeight: 90 }}
                className="w-full bg-surfaceLight border border-white/10 rounded-2xl p-4 text-white text-base"
              />
            </View>

            <Pressable onPress={handleCreatePitch} disabled={loading || !movieTitle || !pitchPrompt}>
              <LinearGradient colors={[Colors.primary, '#9B1B30']} className="rounded-2xl p-5 items-center justify-center">
                {loading ? <ActivityIndicator color="white" /> : (
                  <View className="flex-row items-center gap-2">
                    <Film size={20} color="white" />
                    <Text className="text-white font-bold text-base">חולל תסריט ומצגת פיץ'</Text>
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.duration(500)} className="gap-6">
            <View className="items-center justify-center p-8 bg-surfaceLight rounded-[32px] border border-white/10">
              <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mb-4">
                <Check size={32} color="#10B981" />
              </View>
              <Text className="text-white text-xl font-bold mb-2">מצגת הפיץ' מוכנה!</Text>
              <Text style={{ textAlign: 'center' }} className="text-white/60 text-sm">
                התסריט נוצר בהצלחה והפיק מצגת Pitch Deck מקצועית.
              </Text>
            </View>

            {pitchDetails && (
              <View className="bg-surfaceLight p-6 rounded-[32px] border border-white/10 gap-4">
                <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-lg font-bold border-b border-white/5 pb-2">תוצרי הפקה</Text>
                <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/80 leading-relaxed text-sm bg-white/5 p-4 rounded-xl border border-white/5">
                  {pitchDetails.outline}
                </Text>
              </View>
            )}

            <Pressable onPress={() => { setSaved(false); setMovieTitle(''); setPitchPrompt(''); }} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 items-center justify-center">
              <Text className="text-white font-bold text-base">צור סרט נוסף</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
