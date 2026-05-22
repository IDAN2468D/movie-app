/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated as RNAnimated,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import Reanimated, {
  FadeInRight,
  Layout,
  useAnimatedStyle,
  interpolateColor,
  FadeInDown,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search as SearchIcon,
  X,
  Star,
  TrendingUp,
  Filter,
  Sparkles,
  Calendar,
  ChevronLeft,
  Mic
} from 'lucide-react-native';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { AIService } from '@/services/AIService';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, POSTER_SIZES } from '@/constants/Theme';
import MarkerHighlight from '@/components/MarkerHighlight';
import BentoMovieCard from '@/components/BentoMovieCard';
import { type TMDBMovie, getGenreName } from '@/lib/tmdb';
import { useSearch } from '@/hooks/useSearch';
import AIOrb from '@/components/AIOrb';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 160;
const GENRE_FILTERS = [28, 12, 16, 35, 80, 27, 10749, 878];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();

  const {
    query,
    results,
    loading,
    searched,
    popular,
    activeGenre,
    isAISearch,
    scrollY,
    fadeAnim,
    isFocused,
    focusAnim,
    setIsFocused,
    handleSearch,
    executeAISearch,
    toggleAIMode,
    handleGenrePress,
    clearSearch,
    applyVoiceResults,
    manualFilters,
    updateManualFilter,
    clearManualFilters,
  } = useSearch();

  const { isRecording, startRecording, stopRecording } = useVoiceRecording();
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [voiceFeedbackText, setVoiceFeedbackText] = useState("מעבד את הבקשה שלך...");

  const handleVoicePress = async () => {
    if (isRecording) {
      const base64 = await stopRecording();
      if (base64) {
        setIsVoiceProcessing(true);
        setVoiceFeedbackText("מפענח את הקול שלך...");
        try {
          const transcribedText = await AIService.transcribeVoice(base64);
          if (transcribedText) {
            setVoiceFeedbackText("מנתח כוונות קוליות...");
            const command = await AIService.detectVoiceCommand(transcribedText);
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setVoiceFeedbackText(command.displayText);
            
            // Wait a moment for user to read feedback
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (command.type === 'navigate' && command.params?.screen) {
              const route = command.params.screen === 'home' ? '/' : `/(tabs)/${command.params.screen}`;
              router.push(route as any);
            } else if (command.type === 'search' && command.params?.query) {
               // Execute regular search text
               handleSearch(command.params.query);
               executeAISearch();
            } else if (command.type === 'mood' && command.params?.mood) {
              const moodResult = await AIService.getMoodRecommendations(command.params.mood);
              setVoiceFeedbackText(`🎭 מסנן לפי מצב רוח: ${moodResult.mood}\n${moodResult.description}`);
              await new Promise(resolve => setTimeout(resolve, 2500));
              
              if (moodResult.genres) {
                applyVoiceResults({ with_genres: moodResult.genres });
              }
            } else {
              // Fallback semantic search
              const filters = await AIService.processVoiceSearch(base64);
              applyVoiceResults(filters);
            }
          }
        } catch (error) {
          console.error('Voice search processing failed', error);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
          setIsVoiceProcessing(false);
          setVoiceFeedbackText("מעבד את הבקשה שלך...");
        }
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await startRecording();
    }
  };

  const inputAnimatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        focusAnim.value,
        [0, 1],
        ['rgba(255, 255, 255, 0.1)', isAISearch ? Colors.secondary : Colors.primary]
      ),
      backgroundColor: interpolateColor(
        focusAnim.value,
        [0, 1],
        [Colors.surfaceLight, '#27272A']
      ),
    };
  });

  const renderDiscovery = () => {
    const heroMovie = popular[0];
    const mediumMovies = popular.slice(1, 3);
    const smallMovies = popular.slice(3, 7);

    return (
      <RNAnimated.View style={{ opacity: fadeAnim }}>
        <View className="mt-6 px-5">
          <View className="flex-row items-center justify-between px-2 mb-5">
            <MarkerHighlight
              text="חיפושים פופולריים"
              className="text-[22px] font-bold text-text"
              color={Colors.primary}
            />
            <TrendingUp size={20} color={Colors.primary} />
          </View>
          
          <View className="gap-3">
            {/* Hero Section */}
            {heroMovie && (
              <BentoMovieCard movie={heroMovie} size="hero" index={0} />
            )}
            
            {/* Medium 2-Column Section */}
            {mediumMovies.length > 0 && (
              <View className="flex-row gap-3">
                {mediumMovies.map((movie, idx) => (
                  <BentoMovieCard key={movie.id} movie={movie} size="medium" index={idx + 1} />
                ))}
              </View>
            )}
            
            {/* Small Horizontal Section */}
            {smallMovies.length > 0 && (
              <View className="flex-row gap-3 mt-1">
                {smallMovies.map((movie, idx) => (
                  <BentoMovieCard key={movie.id} movie={movie} size="small" index={idx + 3} />
                ))}
              </View>
            )}
          </View>
        </View>
      </RNAnimated.View>
    );
  };



  const renderResultItem = ({ item, index }: { item: TMDBMovie; index: number }) => {
    return (
      <Reanimated.View
        entering={FadeInRight.delay(index * 50).duration(400)}
        layout={Layout.springify()}
        style={{ marginHorizontal: 20, marginBottom: 16, height: ITEM_HEIGHT, borderRadius: 24, overflow: 'hidden' }}
      >
        <Pressable
          onPress={() => router.push(`/movie/${item.id}`)}
          className="flex-1"
        >
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          <View className="flex-row flex-1 border border-white/10 rounded-[24px] overflow-hidden">
            {/* Poster - Left side */}
            <View className="w-28 h-full shadow-2xl">
              <Image
                source={item.poster_path ? { uri: `${POSTER_SIZES.small}${item.poster_path}` } : require('../../assets/images/poster-placeholder.png')}
                className="w-full h-full"
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.5)']}
                className="absolute inset-0"
              />
            </View>

            {/* Content - Right side */}
            <View className="flex-1 p-4 justify-between items-start">
              <View className="items-start w-full">
                <Text
                  className="text-white text-[18px] text-left font-bold leading-tight"
                  style={{ fontFamily: 'Rubik-Bold' }}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>

                <View className="flex-row items-center mt-3 gap-2">
                  <View className="flex-row items-center bg-secondary/20 px-2 py-0.5 rounded-lg border border-secondary/20">
                    <Star size={12} color={Colors.secondary} fill={Colors.secondary} />
                    <Text className="text-secondary text-[12px] font-bold ms-1" style={{ fontFamily: 'Rubik-Medium' }}>
                      {item.vote_average.toFixed(1)}
                    </Text>
                  </View>
                  <View className="flex-row items-center bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                    <Calendar size={12} color={Colors.textSecondary} />
                    <Text className="text-textSecondary text-[12px] ms-1" style={{ fontFamily: 'Rubik-Regular' }}>
                      {item.release_date?.split('-')[0]}
                    </Text>
                  </View>
                </View>

                <Text className="text-textMuted text-[12px] mt-2 text-left" style={{ fontFamily: 'Rubik-Regular' }}>
                  {getGenreName(item.genre_ids[0])}
                </Text>
              </View>

              <View className="flex-row justify-between items-center w-full">
                <View className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl">
                  <Text className="text-primary text-[11px] font-bold" style={{ fontFamily: 'Rubik-Bold' }}>פרטים נוספים</Text>
                </View>
                <ChevronLeft size={18} color={Colors.textMuted} />
              </View>
            </View>
          </View>
        </Pressable>
      </Reanimated.View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Visual Accents */}
      <View className="absolute top-0 right-0 w-[300] h-[300] bg-primary/5 rounded-full blur-[100px]" />
      <View className="absolute bottom-0 left-0 w-[250] h-[250] bg-secondary/5 rounded-full blur-[80px]" />

      <RNAnimated.FlatList
        data={searched ? results : []}
        renderItem={renderResultItem}
        keyExtractor={(item) => item.id.toString()}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 100 }}>
                  {!searched && renderDiscovery()}
            {searched && results.length > 0 && (
              <View className="px-10 mt-6 mb-2">
                <Text className="text-textMuted text-[14px] text-left" style={{ fontFamily: 'Rubik-Medium' }}>מצאנו {results.length} תוצאות</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={loading ? (
          <View className="mt-[100px] items-center justify-center">
            <ActivityIndicator size="large" color={isAISearch ? Colors.secondary : Colors.primary} />
            {isAISearch && <Text className="text-[14px] text-secondary mt-4 font-body" style={{ fontFamily: 'Rubik-Medium' }}>ה-AI מחפש עבורך...</Text>}
          </View>
        ) : searched ? (
          <View className="mt-[100px] items-center justify-center gap-4">
            <Text className="text-[64px] mb-2.5">😕</Text>
            <Text className="text-[16px] text-textSecondary text-center px-10" style={{ fontFamily: 'Rubik-Regular' }}>
              לא נמצאו תוצאות{query ? ` עבור "${query}"` : ' בקטגוריה זו'}
            </Text>
          </View>
        ) : null}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Header */}
      <View className="absolute top-0 start-0 end-0 z-50 pb-5 border-b border-white/10" style={{ paddingTop: insets.top + 10 }}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <View className="px-5">
          <Reanimated.View
            style={[
              inputAnimatedStyle,
              {
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 20,
                paddingHorizontal: 16,
                height: 60,
                borderWidth: 1,
                overflow: 'hidden',
                shadowColor: isAISearch ? Colors.secondary : Colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowRadius: 15,
                elevation: 10,
                transform: [{ scale: isFocused ? 1.01 : 1 }],
                shadowOpacity: isFocused ? 0.3 : 0,
              }
            ]}
          >
            <Pressable onPress={toggleAIMode} className="p-1">
              <Sparkles size={22} color={isAISearch ? Colors.secondary : Colors.textMuted} />
            </Pressable>
            <TextInput
              className="flex-1 text-[16px] text-white h-12 mx-3 font-body bg-transparent"
              placeholder={isRecording ? "מקשיב..." : isVoiceProcessing ? "מעבד קול..." : isAISearch ? "חיפוש חכם (למשל: 'סרט חלל עצוב')" : "חפש סרטים, ז'אנרים או שחקנים..."}
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={handleSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoCorrect={false}
              underlineColorAndroid="transparent"
              returnKeyType={isAISearch ? "search" : "search"}
              onSubmitEditing={isAISearch ? executeAISearch : undefined}
              textAlign="right"
              style={{ fontFamily: 'Rubik-Regular', writingDirection: 'rtl' }}
              selectionColor={isAISearch ? Colors.secondary : Colors.primary}
              editable={!isRecording && !isVoiceProcessing}
            />

            <View className="flex-row items-center gap-2">
              {query.length > 0 && !isRecording ? (
                <Pressable
                  onPress={clearSearch}
                  className="w-8 h-8 rounded-full bg-white/10 justify-center items-center"
                >
                  <X size={16} color={Colors.text} />
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleVoicePress}
                  className={`w-10 h-10 rounded-full justify-center items-center ${isRecording ? 'bg-primary' : 'bg-white/5'}`}
                >
                  {isRecording && <View className="absolute inset-0 items-center justify-center"><View className="w-8 h-8 bg-white/20 rounded-full animate-pulse" /></View>}
                  {isVoiceProcessing ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Mic size={20} color={isRecording ? 'white' : (isFocused && !isAISearch ? Colors.primary : Colors.textMuted)} />
                  )}
                </Pressable>
              )}
              {query.length === 0 && !isRecording && (
                <SearchIcon size={22} color={isFocused && !isAISearch ? Colors.primary : Colors.textMuted} />
              )}
            </View>
          </Reanimated.View>
        </View>
      </View>

      {(isRecording || isVoiceProcessing) && (
        <Reanimated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(400)}
          style={[StyleSheet.absoluteFill, { zIndex: 100, alignItems: 'center', justifyContent: 'center' }]}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <AIOrb isRecording={isRecording} isProcessing={isVoiceProcessing} size={160} />

          <Reanimated.View entering={FadeIn.delay(200)}>
            <Text
              className="text-white text-[20px] mt-12 font-bold text-center px-10"
              style={{ fontFamily: 'Rubik-Bold' }}
            >
              {isRecording ? "אני מקשיב... ספר לי איזה סרט מתחשק לך לראות" : voiceFeedbackText}
            </Text>
          </Reanimated.View>

          {isRecording && (
            <Reanimated.View
              entering={FadeInDown.delay(50)}
              layout={Layout.springify()}
              style={[
                { width: '48%', marginBottom: 16 },
                inputAnimatedStyle,
              ]}
            >
              <Pressable onPress={handleVoicePress} className="bg-primary/20 px-10 py-4 rounded-[24px] border border-primary/30">
                <Text className="text-primary font-bold text-[16px]" style={{ fontFamily: 'Rubik-Bold' }}>סיום והקלטה</Text>
              </Pressable>
            </Reanimated.View>
          )}
        </Reanimated.View>
      )}
    </View>
  );
}
