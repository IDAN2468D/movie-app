import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Image, ActivityIndicator, I18nManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronRight, ChevronLeft, Sparkles, Play, Video } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Colors } from '@/constants/Theme';
import { API_BASE_URL } from '@/constants/Config';
import { safeFetch } from '@/store/apiHelper';
import { useAuthStore } from '@/store/useAuthStore';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function CineVisionScreen() {
  const insets = useSafeAreaInsets();
  const { movieId, movieTitle, backdropPath } = useLocalSearchParams<{ movieId: string; movieTitle: string; backdropPath: string }>();

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [moodTags, setMoodTags] = useState<string[]>([]);

  // Configure Expo Video Player
  const player = useVideoPlayer(generatedVideoUrl || '', (p) => {
    p.loop = true;
    p.play();
  });

  const handleGenerateTeaser = async () => {
    if (!prompt.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsGenerating(true);
    setGeneratedVideoUrl(null);

    try {
      const token = useAuthStore.getState().token;
      const response = await safeFetch(`${API_BASE_URL}/mcp/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          movieId: movieId || '0',
          movieTitle: movieTitle || 'סרט',
          prompt,
        }),
      });

      if (response.success && response.data) {
        setGeneratedVideoUrl(response.data.videoUrl);
        setMoodTags(response.data.moodTags || []);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      console.error('CineVision generation error:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Background Cover */}
      <View className="absolute inset-0">
        {backdropPath ? (
          <Image 
            source={{ uri: `https://image.tmdb.org/t/p/w1280${backdropPath}` }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full bg-[#09090B]" />
        )}
        <BlurView intensity={90} tint="dark" className="absolute inset-0" />
        <LinearGradient 
          colors={['transparent', 'rgba(9,9,11,0.85)', '#09090B']} 
          className="absolute inset-0" 
        />
      </View>

      {/* Header */}
      <View 
        className="flex-row items-center px-6 pb-4 pt-2 gap-4 z-20"
        style={{ marginTop: insets.top }}
      >
        <Pressable 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }} 
          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 justify-center items-center active:scale-95"
        >
          {I18nManager.isRTL ? <ChevronRight size={24} color="white" /> : <ChevronLeft size={24} color="white" />}
        </Pressable>
        
        <View className="flex-1 items-start">
          <Text className="text-h2 text-white font-display leading-tight text-left" style={{ fontFamily: 'Rubik-Bold' }}>CineVision AI 🎬</Text>
          <Text className="text-caption text-white/50 font-medium text-left" style={{ fontFamily: 'Assistant-Regular' }}>חולל קדימון אווירה מותאם אישית לסרט</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 mt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Movie Title Header */}
        <Animated.View entering={FadeInUp.springify()} className="mb-6 items-start">
          <Text className="text-white text-caption tracking-widest opacity-60 uppercase" style={{ fontFamily: 'Assistant-Regular' }}>מחולל קדימונים עבור</Text>
          <Text className="text-white text-3xl font-bold text-left" style={{ fontFamily: 'Rubik-Bold' }}>{movieTitle || 'סרט קולנוע'}</Text>
        </Animated.View>

        {/* Video Player / Video Placeholder Area */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-6">
          <View className="w-full aspect-video rounded-[24px] overflow-hidden border border-white/10 bg-black/40 relative justify-center items-center">
            {generatedVideoUrl ? (
              <VideoView 
                style={{ width: '100%', height: '100%' }} 
                player={player} 
              />
            ) : (
              <View className="items-center p-6">
                {isGenerating ? (
                  <ActivityIndicator size="large" color={Colors.primary} />
                ) : (
                  <>
                    <Video size={48} color="rgba(255, 255, 255, 0.3)" />
                    <Text className="text-white/60 text-sm mt-3 text-center" style={{ fontFamily: 'Assistant-Regular' }}>
                      הזן אווירה למטה ולחץ על "חולל קדימון" כדי לצפות בתוצאה
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Mood Tags */}
          {moodTags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-3 justify-start">
              {moodTags.map((tag, index) => (
                <View key={index} className="bg-primary/20 border border-primary/30 px-3 py-1 rounded-full">
                  <Text className="text-primary text-xs font-semibold" style={{ fontFamily: 'Assistant-SemiBold' }}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Input Prompt Panel */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="bg-surfaceGlass/40 border border-white/8 rounded-[24px] overflow-hidden p-5">
          <BlurView intensity={30} tint="dark" className="absolute inset-0" />
          
          <Text className="text-white text-base font-bold text-right mb-2" style={{ fontFamily: 'Rubik-Medium' }}>
            תאר את האווירה המבוקשת:
          </Text>

          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="לדוגמה: אווירת פילם-נואר חשוכה, גשם כבד ברחובות ניאון..."
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            multiline
            numberOfLines={4}
            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white text-right mb-4"
            style={{ fontFamily: 'Assistant-Regular', textAlign: 'right' }}
          />

          <Pressable 
            onPress={handleGenerateTeaser}
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-4 rounded-xl flex-row justify-center items-center gap-2 active:scale-95 ${
              isGenerating || !prompt.trim() ? 'bg-white/10 opacity-50' : 'bg-primary'
            }`}
          >
            <Sparkles size={18} color="white" />
            <Text className="text-white font-bold text-base" style={{ fontFamily: 'Rubik-Medium' }}>
              {isGenerating ? 'מחולל קדימון AI...' : 'חולל קדימון באווירה זו'}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
