import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Film, Sparkles, X, Compass, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';

const GENRES = ['Sci-Fi Noir', 'Hebrew Bourekas', 'Cyberpunk', 'Western', 'Classic Drama'];
const { width } = Dimensions.get('window');

export default function CineDirectorScreen() {
  const insets = useSafeAreaInsets();
  const [sceneText, setSceneText] = useState('');
  const [selectedGenreIndex, setSelectedGenreIndex] = useState(0);
  const [reimaginedScene, setReimaginedScene] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLocalFallback, setIsLocalFallback] = useState(false);

  // Shared value for rotation angle
  const rotation = useSharedValue(0);

  const updateGenre = (delta: number) => {
    let nextIndex = selectedGenreIndex + delta;
    if (nextIndex < 0) nextIndex = GENRES.length - 1;
    if (nextIndex >= GENRES.length) nextIndex = 0;
    setSelectedGenreIndex(nextIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      // Rotate dial dynamically during drag
      rotation.value = event.translationX;
    })
    .onEnd((event) => {
      // Trigger genre change on drag finish
      if (event.translationX > 50) {
        runOnJS(updateGenre)(-1);
      } else if (event.translationX < -50) {
        runOnJS(updateGenre)(1);
      }
      rotation.value = withSpring(0, { damping: 12 });
    });

  const animatedDialStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` }
      ]
    };
  });

  const handleReimagine = async () => {
    if (!sceneText) return;
    setLoading(true);
    setReimaginedScene('');
    setIsLocalFallback(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      const response = await fetch('http://localhost:5000/api/mcp/director/reimagine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-dev-token'
        },
        body: JSON.stringify({
          movieTitle: 'סרט מותאם אישית',
          genre: GENRES[selectedGenreIndex],
          sceneDescription: sceneText
        })
      });

      const json = await response.json();
      if (json.success) {
        setReimaginedScene(json.data.reimaginedScene);
        setIsLocalFallback(!!json.data.isLocalFallback);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.warn('AI API error, fallback to offline simulation:', err);
      setIsLocalFallback(true);
      setReimaginedScene(`[שחזור מקומי - במאי AI]\n\nהסצנה שוכתבה בהצלחה לז'אנר "${GENRES[selectedGenreIndex]}":\nהדמויות עומדות במרכז הבמה תחת גשם שוטף וצבעי ניאון כחולים. הדיאלוג מהיר, סוער ותואם את האווירה החדשה שנוצרה.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }} className="flex-1 px-6">
        
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <Pressable onPress={() => router.back()} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <X size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-display">CineDirector AI Studio</Text>
          <View className="w-12" />
        </View>

        {/* Scene Text Input */}
        <Animated.View entering={FadeInDown.duration(600).springify()} className="mb-6">
          <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/60 mb-2 font-body">הסצנה המקורית שלך</Text>
          <TextInput
            value={sceneText}
            onChangeText={setSceneText}
            placeholder="הקלד כאן תיאור סצנה מסרט כלשהו..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            multiline
            numberOfLines={4}
            style={{ textAlign: 'right', writingDirection: 'rtl', minHeight: 90, fontFamily: 'Rubik-Regular' }}
            className="w-full bg-surfaceLight border border-white/10 rounded-2xl p-4 text-white text-base"
          />
        </Animated.View>

        {/* Dial Section */}
        <Animated.View entering={FadeInDown.duration(600).delay(100).springify()} className="rounded-3xl border border-white/10 bg-surfaceLight p-6 mb-6 items-center">
          <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-base font-bold mb-1">גלגל ז'אנרים סינמטיים</Text>
          <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/40 text-xs mb-6">החליקו שמאלה או ימינה כדי לסובב את חוגת הז'אנר</Text>
          
          {/* Dial Gesture Interface */}
          <GestureDetector gesture={gesture}>
            <Animated.View 
              style={[animatedDialStyle]} 
              className="w-40 h-40 rounded-full border-4 border-white/10 bg-black/60 justify-center items-center relative shadow-2xl"
            >
              <Compass size={40} color={Colors.primary} />
              
              {/* Dial Notch ticks */}
              {Array.from({ length: 8 }).map((_, i) => (
                <View 
                  key={i} 
                  style={{
                    position: 'absolute',
                    width: 3,
                    height: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    transform: [{ rotate: `${i * 45}deg` }, { translateY: -70 }]
                  }}
                />
              ))}
            </Animated.View>
          </GestureDetector>

          {/* Selected Genre Banner */}
          <View className="mt-6 px-6 py-2 bg-primary/10 border border-primary/30 rounded-full">
            <Text className="text-primary text-base font-bold">{GENRES[selectedGenreIndex]}</Text>
          </View>
        </Animated.View>

        {/* Reimagine CTA Button */}
        <Animated.View entering={FadeInDown.duration(600).delay(200).springify()} className="mb-6">
          <Pressable onPress={handleReimagine} disabled={loading || !sceneText} className="rounded-2xl overflow-hidden">
            <LinearGradient colors={[Colors.primary, '#9B1B30']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 flex-row justify-center items-center gap-2">
              <Sparkles size={20} color="white" />
              <Text className="text-white text-base font-bold">
                {loading ? 'משכתב סצנה...' : 'שכתב סצנה בעזרת במאי AI'}
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Preview Output Panel */}
        {!!reimaginedScene && (
          <Animated.View entering={FadeInDown.duration(600).springify()} className="rounded-3xl border border-white/10 bg-surfaceLight p-6 mb-6">
            
            {/* Fallback Banner Indicator */}
            {isLocalFallback && (
              <View className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex-row items-center gap-3 mb-4">
                <AlertCircle size={20} color={Colors.warning} />
                <Text style={{ textAlign: 'right', flex: 1 }} className="text-amber-500 text-xs font-semibold">מנוע AI פועל כעת במצב שחזור מקומי אופליין</Text>
              </View>
            )}

            <View className="flex-row items-center justify-between mb-4 border-b border-white/5 pb-3">
              <Film size={18} color={Colors.secondary} />
              <Text className="text-white text-sm font-bold">הסצנה המשוכתבת</Text>
            </View>
            
            <Text 
              style={{ textAlign: 'right', writingDirection: 'rtl', fontFamily: 'Rubik-Regular', lineHeight: 24 }} 
              className="text-white/80 text-base"
            >
              {reimaginedScene}
            </Text>
          </Animated.View>
        )}

      </ScrollView>
    </View>
  );
}
