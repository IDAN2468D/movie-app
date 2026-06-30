import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Platform, I18nManager, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeInRight,
  useAnimatedScrollHandler, 
  useSharedValue, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolation,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { ChevronRight, ChevronLeft, Sparkles, Star, Film, Gamepad2, Award } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { useActorStore } from '@/store/useActorStore';
import { getImageSource, handleImageError } from '@/utils/ImageUtils';
import * as Haptics from 'expo-haptics';

// --- Traits Analyzer Component ---
const TraitBar = ({ label, value, index }: { label: string, value: number, index: number }) => {
  const progress = useSharedValue(0);
  
  useEffect(() => {
    progress.value = withTiming(value, { duration: 1000 + index * 200 });
  }, [value, index]);
  
  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View className="mb-4">
      <View className="flex-row-reverse justify-between items-center mb-1">
        <Text className="text-white/90 font-body text-[14px]" style={{ textAlign: 'right' }}>{label}</Text>
        <Text className="text-primary font-display text-[14px]">{value}%</Text>
      </View>
      <View className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex-row-reverse">
        <Animated.View className="h-full bg-primary rounded-full" style={barStyle} />
      </View>
    </View>
  );
};

export default function ActorBiographyScreen() {
  const { id, name, profilePath } = useLocalSearchParams<{ id: string; name: string; profilePath: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [imageSource, setImageSource] = useState<any>(getImageSource(profilePath || null, 'profile', 'large'));
  
  const { 
    cache, isLoading, error, fetchBiography,
    activeQuestionIndex, chosenAnswers, score, answerTrivia 
  } = useActorStore();
  const biography = name ? cache[name as string] : null;

  useEffect(() => {
    if (name) {
      fetchBiography(name as string);
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
            className="text-white text-h1 font-display mt-6 text-center"
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
              <View className="flex-row-reverse items-center justify-start mb-4 gap-2">
                <Sparkles size={18} color={Colors.primary} />
                <Text className="text-white text-h3 font-display" style={{ textAlign: 'right' }}>תקציר ביוגרפי</Text>
              </View>
              <Text 
                className="text-white/80 leading-relaxed font-body"
                style={{ textAlign: 'right', writingDirection: 'rtl', marginEnd: 4 }}
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
              <View className="flex-row-reverse items-center justify-start mb-4 gap-2">
                <Star size={18} color={Colors.secondary} />
                <Text className="text-white text-h3 font-display" style={{ textAlign: 'right' }}>חותם אמנותי</Text>
              </View>
              <Text 
                className="text-white/80 leading-relaxed font-body"
                style={{ textAlign: 'right', writingDirection: 'rtl', marginEnd: 4 }}
              >
                {biography.חותם_אמנותי}
              </Text>
            </Animated.View>

            {/* Acting Traits Analyzer */}
            {biography.תכונות_משחק && (
              <Animated.View 
                entering={FadeInDown.springify().damping(14).delay(400)}
                className="bg-white/10 rounded-3xl p-6 border border-white/10 overflow-hidden relative"
              >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <View className="flex-row-reverse items-center justify-start mb-6 gap-2">
                  <Award size={18} color={Colors.primary} />
                  <Text className="text-white text-h3 font-display" style={{ textAlign: 'right' }}>ניתוח תכונות משחק</Text>
                </View>
                <View>
                  <TraitBar label="דרמה ויכולת רגשית" value={biography.תכונות_משחק.דרמה || 0} index={0} />
                  <TraitBar label="כריזמה ונוכחות מסך" value={biography.תכונות_משחק.כריזמה || 0} index={1} />
                  <TraitBar label="גיוון ויכולת השתנות" value={biography.תכונות_משחק.גיוון || 0} index={2} />
                  <TraitBar label="תזמון קומי" value={biography.תכונות_משחק.קומדיה || 0} index={3} />
                </View>
              </Animated.View>
            )}

            {/* Iconic Roles Slider */}
            {biography.תפקידים_אייקונים && biography.תפקידים_אייקונים.length > 0 && (
              <Animated.View 
                entering={FadeInDown.springify().damping(14).delay(500)}
                className="mt-2"
              >
                <View className="flex-row-reverse items-center justify-start mb-4 gap-2 px-2">
                  <Film size={18} color={Colors.secondary} />
                  <Text className="text-white text-h3 font-display" style={{ textAlign: 'right' }}>תפקידים אייקונים</Text>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 10, gap: 16, flexDirection: 'row-reverse' }}
                >
                  {biography.תפקידים_אייקונים.map((role: any, idx: number) => (
                    <Animated.View 
                      entering={FadeInRight.delay(500 + idx * 100).springify()} 
                      key={idx}
                    >
                      <Pressable 
                        className="bg-white/10 rounded-3xl p-5 border border-white/10 w-64 overflow-hidden relative active:scale-95"
                        style={{ transform: [{ scale: 1 }] }}
                      >
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <Text className="text-white font-display text-[18px] mb-1" style={{ textAlign: 'right' }}>{role.שם_הסרט}</Text>
                        <Text className="text-primary font-body text-[14px] mb-3" style={{ textAlign: 'right' }}>{role.שם_הדמות}</Text>
                        <View className="bg-white/10 self-end px-3 py-1 rounded-full">
                          <Text className="text-white/60 text-[12px] font-body">{role.שנת_יציאה}</Text>
                        </View>
                      </Pressable>
                    </Animated.View>
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            {/* Interactive Trivia */}
            {biography.שאלון_טריוויה && biography.שאלון_טריוויה.length > 0 && (
              <Animated.View 
                entering={FadeInDown.springify().damping(14).delay(600)}
                className="bg-white/10 rounded-3xl p-6 border border-white/10 overflow-hidden relative"
              >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <View className="flex-row-reverse items-center justify-start mb-6 gap-2">
                  <Gamepad2 size={18} color={Colors.primary} />
                  <Text className="text-white text-h3 font-display" style={{ textAlign: 'right' }}>בחן את עצמך</Text>
                </View>
                
                {biography.שאלון_טריוויה.map((q: any, qIndex: number) => {
                  const isAnswered = chosenAnswers[qIndex] !== undefined;
                  const chosenOption = chosenAnswers[qIndex];
                  
                  return (
                    <View key={qIndex} className="mb-8">
                      <Text className="text-white/90 text-h4 font-display mb-4" style={{ textAlign: 'right' }}>
                        {qIndex + 1}. {q.שאלה}
                      </Text>
                      <View className="gap-3">
                        {q.אפשרויות.map((option: string, optIndex: number) => {
                          const isCorrect = optIndex === q.תשובה_נכונה;
                          const isSelected = chosenOption === optIndex;
                          
                          let bgColor = 'bg-white/5';
                          let borderColor = 'border-white/10';
                          
                          if (isAnswered) {
                            if (isCorrect) {
                              bgColor = 'bg-green-500/20';
                              borderColor = 'border-green-500/50';
                            } else if (isSelected) {
                              bgColor = 'bg-red-500/20';
                              borderColor = 'border-red-500/50';
                            }
                          }
                          
                          return (
                            <TouchableOpacity 
                              key={optIndex}
                              activeOpacity={0.7}
                              onPress={() => {
                                if (!isAnswered) {
                                  Haptics.impactAsync(isCorrect ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
                                  answerTrivia(qIndex, optIndex, isCorrect);
                                }
                              }}
                              className={`${bgColor} border ${borderColor} rounded-2xl p-4 flex-row-reverse justify-between items-center`}
                            >
                              <Text className="text-white font-body text-[14px]" style={{ textAlign: 'right' }}>{option}</Text>
                              {isAnswered && isCorrect && <Text className="text-green-400">✓</Text>}
                              {isAnswered && isSelected && !isCorrect && <Text className="text-red-400">✗</Text>}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
                <View className="items-center mt-2 border-t border-white/10 pt-4">
                  <Text className="text-white/60 font-body">הניקוד שלך: <Text className="text-primary font-display">{score}</Text> מתוך {Object.keys(chosenAnswers).length}</Text>
                </View>
              </Animated.View>
            )}

            {/* General Trivia Details */}
            {biography.טריוויה && biography.טריוויה.length > 0 && (
              <Animated.View 
                entering={FadeInDown.springify().damping(14).delay(700)}
                className="bg-white/10 rounded-3xl p-6 border border-white/10 overflow-hidden relative"
              >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <View className="flex-row-reverse items-center justify-start mb-4 gap-2">
                  <Sparkles size={18} color={Colors.primary} />
                  <Text className="text-white text-h3 font-display" style={{ textAlign: 'right' }}>פרטי טריוויה מפתיעים</Text>
                </View>
                <View className="gap-4">
                  {biography.טריוויה.map((fact: string, index: number) => (
                    <View key={index} className="flex-row-reverse justify-start items-start gap-3">
                      <View className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <Text 
                        className="text-white/80 leading-relaxed font-body flex-1"
                        style={{ textAlign: 'right', writingDirection: 'rtl', marginEnd: 8 }}
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
