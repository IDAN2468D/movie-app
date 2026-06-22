import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Film, Sparkles, Check, X, FileText, Video } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Typography } from '@/constants/Theme';
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'mock-dev-token'}`
        },
        body: JSON.stringify({
          movieTitle,
          genre,
          pitchPrompt
        })
      });

      const json = await response.json();
      if (json.success) {
        setPitchDetails(json.data);
        setSaved(true);
      } else {
        throw new Error(json.message || 'Server returned failure response');
      }
    } catch (error) {
      console.warn('API error, simulating pitch deck...', error);
      setPitchDetails({
        movieTitle,
        genre,
        pitchPrompt,
        outline: 'סרט מרהיב במיוחד המציג עולם דיסטופי שבו בני האדם נלחמים על זכות הקיום.',
        googleSlidesId: 'slides-deck-8787878'
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
          <Text className="text-white text-h2 font-display">CinePitch Studio</Text>
          <View className="w-12" />
        </View>

        {!saved ? (
          <Animated.View entering={FadeInDown.duration(600)} className="gap-6">
            <View>
              <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/60 mb-2 font-body">שם הסרט המקורי שלך</Text>
              <TextInput
                value={movieTitle}
                onChangeText={setMovieTitle}
                placeholder="למשל: אחרון שורדי האור"
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={{ textAlign: 'right', writingDirection: 'rtl', fontFamily: 'Rubik-Regular' }}
                className="w-full bg-surfaceLight border border-white/10 rounded-2xl p-4 text-white text-base"
              />
            </View>

            <View>
              <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/60 mb-2 font-body">ז'אנר</Text>
              <TextInput
                value={genre}
                onChangeText={setGenre}
                placeholder="למשל: דרמה, פעולה, מדע בדיוני"
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={{ textAlign: 'right', writingDirection: 'rtl', fontFamily: 'Rubik-Regular' }}
                className="w-full bg-surfaceLight border border-white/10 rounded-2xl p-4 text-white text-base"
              />
            </View>

            <View>
              <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/60 mb-2 font-body">תקציר הרעיון (Concept Logline)</Text>
              <TextInput
                value={pitchPrompt}
                onChangeText={setPitchPrompt}
                multiline
                numberOfLines={4}
                placeholder="כתבו תיאור קצר של העלילה והאווירה הכללית של הסרט..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={{ textAlign: 'right', writingDirection: 'rtl', minHeight: 100, fontFamily: 'Rubik-Regular' }}
                className="w-full bg-surfaceLight border border-white/10 rounded-2xl p-4 text-white text-base"
              />
            </View>

            <Pressable onPress={handleCreatePitch} disabled={loading || !movieTitle || !pitchPrompt}>
              <LinearGradient
                colors={[Colors.primary, '#9B1B30']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl p-5 items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View className="flex-row items-center gap-2">
                    <Film size={20} color="white" />
                    <Text className="text-white font-bold text-base" style={{ fontFamily: 'Rubik-Bold' }}>חולל תסריט ומצגת פיץ'</Text>
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
              <Text style={{ fontFamily: 'Rubik-Bold' }} className="text-white text-xl mb-2">מצגת הפיץ' מוכנה!</Text>
              <Text style={{ textAlign: 'center', fontFamily: 'Assistant-Regular' }} className="text-white/60">
                התסריט נוצר בהצלחה והמערכת הפיקה עבורך מצגת Pitch Deck מקצועית המשולבת ב-Google Slides.
              </Text>
            </View>

            {pitchDetails && (
              <View className="bg-surfaceLight p-6 rounded-[32px] border border-white/10 gap-4">
                <Text style={{ fontFamily: 'Rubik-Bold', textAlign: 'right' }} className="text-white text-lg border-b border-white/5 pb-2">תקציר ותוצרי הפקה</Text>
                
                <View className="flex-row justify-between items-center" style={{ flexDirection: 'row-reverse' }}>
                  <Text className="text-white/50" style={{ fontFamily: 'Assistant-Regular' }}>מזהה מצגת:</Text>
                  <Text className="text-primary font-mono text-sm">{pitchDetails.googleSlidesId}</Text>
                </View>

                <View>
                  <Text className="text-white/50 text-right mb-1" style={{ fontFamily: 'Assistant-Regular' }}>תקציר מנוהל AI:</Text>
                  <Text style={{ textAlign: 'right', writingDirection: 'rtl', fontFamily: 'Assistant-Regular' }} className="text-white/80 leading-relaxed text-sm bg-white/5 p-4 rounded-xl border border-white/5">
                    {pitchDetails.outline}
                  </Text>
                </View>

                {!pitchDetails.googleSlidesId.startsWith('mock-') && pitchDetails.googleSlidesId !== 'slides-deck-8787878' ? (
                  <Pressable 
                    onPress={() => {
                      const url = `https://docs.google.com/presentation/d/${pitchDetails.googleSlidesId}/edit`;
                      Linking.openURL(url).catch(err => {
                        console.error('Failed to open URL:', err);
                        Alert.alert('שגיאה', 'לא ניתן לפתוח את הקישור במכשיר זה');
                      });
                    }}
                    className="w-full bg-[#E5FF00] rounded-2xl p-4 items-center justify-center mt-2 flex-row gap-2"
                  >
                    <FileText size={20} color="black" />
                    <Text className="text-black font-bold text-base" style={{ fontFamily: 'Rubik-Bold' }}>פתח מצגת ב-Google Slides</Text>
                  </Pressable>
                ) : (
                  <Text style={{ textAlign: 'right', fontFamily: 'Assistant-Regular' }} className="text-amber-500 text-xs mt-1">
                    ⚠️ שים לב: זוהי מצגת סימולציה מקומית (מצב לא מקוון).
                  </Text>
                )}
              </View>
            )}


            <Pressable 
              onPress={() => {
                setSaved(false);
                setMovieTitle('');
                setPitchPrompt('');
                setPitchDetails(null);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 items-center justify-center"
            >
              <Text className="text-white font-bold text-base" style={{ fontFamily: 'Rubik-Bold' }}>צור סרט נוסף</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
