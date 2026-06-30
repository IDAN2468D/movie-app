import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Platform, I18nManager } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  useAnimatedScrollHandler, 
  useSharedValue, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolation,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { ChevronRight, ChevronLeft, Sparkles, Star } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { useActorStore } from '@/store/useActorStore';
import { getImageSource, handleImageError } from '@/utils/ImageUtils';
import * as Haptics from 'expo-haptics';

export default function ActorBiographyScreen() {
  const { id, name, profilePath } = useLocalSearchParams<{ id: string; name: string; profilePath: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [imageSource, setImageSource] = useState<any>(getImageSource(profilePath || null, 'profile', 'large'));
  
  const { cache, isLoading, error, fetchBiography } = useActorStore();
  const biography = name ? cache[name] : null;

  useEffect(() => {
    if (name) {
      fetchBiography(name);
    }
  }, [name, fetchBiography]);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const profileAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [0, 200], [1, 0.6], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [0, 200], [0, 50], Extrapolation.CLAMP);
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const skeletonOpacity = useSharedValue(0.3);
  useEffect(() => {
    if (isLoading) {
      skeletonOpacity.value = withRepeat(withTiming(0.8, { duration: 800 }), -1, true);
    }
  }, [isLoading, skeletonOpacity]);

  const skeletonStyle = useAnimatedStyle(() => ({
    opacity: skeletonOpacity.value,
  }));

  const renderSkeleton = () => (
    <Animated.View style={skeletonStyle} className="w-full mt-6 gap-6">
      <View className="bg-white/10 rounded-3xl p-6 border border-white/5 h-32" />
      <View className="bg-white/10 rounded-3xl p-6 border border-white/5 h-40" />
      <View className="bg-white/10 rounded-3xl p-6 border border-white/5 h-24" />
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Absolute Background Layer */}
      <View style={StyleSheet.absoluteFill}>
        <Image 
          source={imageSource} 
          className="w-full h-[60%]" 
          resizeMode="cover"
          onError={() => handleImageError(setImageSource, 'profile')}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)', Colors.background, Colors.background]}
          locations={[0, 0.4, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Floating Back Button */}
      <Pressable
        className="absolute start-4 z-20"
        style={{ top: Platform.OS === 'android' ? Math.max(insets.top, 40) + 8 : insets.top + 10 }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      >
        <BlurView intensity={40} tint="dark" className="w-11 h-11 rounded-full overflow-hidden border border-white/10 items-center justify-center bg-black/25">
          {I18nManager.isRTL ? <ChevronRight size={24} color="white" /> : <ChevronLeft size={24} color="white" />}
        </BlurView>
      </Pressable>

      <Animated.ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 120, paddingBottom: insets.bottom + 40, paddingHorizontal: 20 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View className="items-center mb-8">
          <Animated.View style={profileAnimatedStyle}>
            <View 
              className="w-32 h-32 rounded-full overflow-hidden border-2 items-center justify-center"
              style={{
                borderColor: Colors.primary,
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 15,
                elevation: 10,
                backgroundColor: 'rgba(255,255,255,0.1)'
              }}
            >
              <Image 
                source={imageSource}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </Animated.View>
          <Animated.Text 
            entering={FadeInDown.springify().damping(14).delay(100)}
            className="text-white text-h1 font-display mt-6"
          >
            {name}
          </Animated.Text>
        </View>

        {/* Content Section */}
        {isLoading ? (
          renderSkeleton()
        ) : error ? (
          <View className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20 items-center mt-6">
            <Text className="text-white font-body text-center" style={{ writingDirection: 'rtl' }}>
              {error}
            </Text>
          </View>
        ) : biography ? (
          <View className="gap-6 mt-4">
            
            {/* Biography Overview */}
            <Animated.View 
              entering={FadeInDown.springify().damping(14).delay(200)}
              className="bg-white/10 rounded-3xl p-6 border border-white/10 overflow-hidden relative"
            >
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <View className="flex-row items-center justify-start mb-4 gap-2">
                <Sparkles size={18} color={Colors.primary} />
                <Text className="text-white text-h3 font-display" style={{ textAlign: 'left' }}>תקציר ביוגרפי</Text>
              </View>
              <Text 
                className="text-white/80 leading-relaxed font-body"
                style={{ textAlign: 'left', writingDirection: 'ltr', marginStart: 4 }}
              >
                {biography.תקציר_ביוגרפי}
              </Text>
            </Animated.View>

            {/* Acting Style Signature */}
            <Animated.View 
              entering={FadeInDown.springify().damping(14).delay(300)}
              className="bg-white/10 rounded-3xl p-6 border border-white/10 overflow-hidden relative"
            >
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <View className="flex-row items-center justify-start mb-4 gap-2">
                <Star size={18} color={Colors.secondary} />
                <Text className="text-white text-h3 font-display" style={{ textAlign: 'left' }}>חותם אמנותי</Text>
              </View>
              <Text 
                className="text-white/80 leading-relaxed font-body"
                style={{ textAlign: 'left', writingDirection: 'ltr', marginStart: 4 }}
              >
                {biography.חותם_אמנותי}
              </Text>
            </Animated.View>

            {/* Trivia */}
            {biography.טריוויה && biography.טריוויה.length > 0 && (
              <Animated.View 
                entering={FadeInDown.springify().damping(14).delay(400)}
                className="bg-white/10 rounded-3xl p-6 border border-white/10 overflow-hidden relative"
              >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <View className="flex-row items-center justify-start mb-4 gap-2">
                  <Sparkles size={18} color={Colors.primary} />
                  <Text className="text-white text-h3 font-display" style={{ textAlign: 'left' }}>פרטי טריוויה מפתיעים</Text>
                </View>
                <View className="gap-4">
                  {biography.טריוויה.map((fact, index) => (
                    <View key={index} className="flex-row justify-start items-start gap-3">
                      <View className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <Text 
                        className="text-white/80 leading-relaxed font-body flex-1"
                        style={{ textAlign: 'left', writingDirection: 'ltr', marginStart: 8 }}
                      >
                        {fact}
                      </Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

          </View>
        ) : null}

      </Animated.ScrollView>
    </View>
  );
}
