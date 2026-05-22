import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Dimensions, ImageBackground, StyleSheet } from 'react-native';
import { getImageSource, handleImageError } from '../utils/ImageUtils';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing, 
  runOnJS,
  cancelAnimation
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { cssInterop } from 'react-native-css-interop';
import { router } from 'expo-router';
import { useBookingStore } from '@/store/useBookingStore';
import { Colors } from '@/constants/Theme';

// Required for NativeWind v4 compatibility with Expo components
cssInterop(BlurView, { className: 'style' });
cssInterop(LinearGradient, { className: 'style' });

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds

interface Story {
  id: number;
  title: string;
  poster: string;
  overview: string;
}

interface MovieStoriesProps {
  stories: Story[];
  onClose: () => void;
  initialIndex?: number;
}

export default function MovieStories({ stories, onClose, initialIndex = 0 }: MovieStoriesProps) {
  // --- ⚠️ CRITICAL: HOOKS AT TOP LEVEL ---
  const insets = useSafeAreaInsets();
  const selectMovie = useBookingStore(state => state.selectMovie);
  
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageSource, setImageSource] = useState(getImageSource(stories[initialIndex]?.poster, 'poster', 'original'));
  const progress = useSharedValue(0);
  const isPaused = useSharedValue(false);

  // עדכון מקור התמונה כאשר האינדקס משתנה
  useEffect(() => {
    if (stories[currentIndex]) {
      setImageSource(getImageSource(stories[currentIndex].poster, 'poster', 'original'));
    }
  }, [currentIndex, stories]);
  
  const nextStory = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const prevStory = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const startProgress = useCallback(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: STORY_DURATION,
      easing: Easing.linear,
    }, (finished) => {
      if (finished) {
        runOnJS(nextStory)();
      }
    });
  }, [nextStory, progress]);

  useEffect(() => {
    startProgress();
    return () => cancelAnimation(progress);
  }, [currentIndex, startProgress, progress]);

  const handleBookNow = () => {
    const currentStory = stories[currentIndex];
    if (!currentStory) return;

    // Pause animation
    cancelAnimation(progress);
    
    // Select movie in store
    selectMovie(currentStory.id, currentStory.title, currentStory.poster);
    
    // Close stories and navigate
    onClose();
    router.push(`/movie/${currentStory.id}`);
  };

  // Gestures
  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      if (event.x < SCREEN_WIDTH / 3) {
        runOnJS(prevStory)();
      } else {
        runOnJS(nextStory)();
      }
    });

  const longPressGesture = Gesture.LongPress()
    .onBegin(() => {
      isPaused.value = true;
      cancelAnimation(progress);
    })
    .onFinalize(() => {
      isPaused.value = false;
      // Resume progress from current value
      const remainingTime = STORY_DURATION * (1 - progress.value);
      progress.value = withTiming(1, {
        duration: remainingTime,
        easing: Easing.linear,
      }, (finished) => {
        if (finished) {
          runOnJS(nextStory)();
        }
      });
    });

  const combinedGesture = Gesture.Exclusive(longPressGesture, tapGesture);

  // Animated Styles
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const currentStory = stories[currentIndex];

  if (!currentStory) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={combinedGesture}>
        <View className="flex-1 bg-black">
          <ImageBackground 
            source={imageSource}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => handleImageError(setImageSource, 'backdrop')}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
              className="absolute inset-0"
            />
            
            {/* Top Bar: Progress & Close */}
            <View 
              className="absolute top-0 left-0 right-0 z-50 px-4"
              style={{ paddingTop: insets.top + 10 }}
            >
              <View className="flex-row gap-1.5 mb-4">
                {stories.map((_, index) => (
                  <View key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    {index === currentIndex && (
                      <Animated.View className="h-full bg-white" style={progressStyle} />
                    )}
                    {index < currentIndex && (
                      <View className="h-full bg-white w-full" />
                    )}
                  </View>
                ))}
              </View>

              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 items-center justify-center">
                    <Text className="text-white font-display text-xs">Cine</Text>
                  </View>
                  <Text className="text-white font-display text-lg">CineBook</Text>
                </View>
                
                <Pressable onPress={onClose} className="w-10 h-10 rounded-full bg-black/40 items-center justify-center">
                  <X color="white" size={24} />
                </Pressable>
              </View>
            </View>

            {/* Content Card (Bottom) */}
            <View 
              className="absolute bottom-0 left-0 right-0 px-6"
              style={{ paddingBottom: insets.bottom + 40 }}
            >
              <BlurView intensity={30} tint="dark" className="rounded-3xl overflow-hidden border border-white/10">
                <View className="p-6">
                  <Text 
                    className="text-white text-3xl font-display mb-2 text-left"
                    style={{ writingDirection: 'ltr' }}
                  >
                    {currentStory.title}
                  </Text>
                  
                  <Text 
                    className="text-textSecondary text-base leading-6 text-left"
                    style={{ 
                      writingDirection: 'ltr',
                      textAlign: 'left' 
                    }}
                    numberOfLines={4}
                  >
                    {currentStory.overview}
                  </Text>

                  <Pressable 
                    onPress={handleBookNow}
                    className="mt-6 bg-primary h-14 rounded-2xl items-center justify-center shadow-lg" style={{ shadowColor: Colors.primary, shadowOpacity: 0.3 }}
                  >
                    <Text className="text-white font-bold text-lg">הזמן כרטיס עכשיו</Text>
                  </Pressable>
                </View>
              </BlurView>
            </View>
          </ImageBackground>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
