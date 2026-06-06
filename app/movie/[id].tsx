/* eslint-disable react-hooks/immutability, react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Movie Details Screen - Full cinematic details with booking flow
 */
import {
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
  ScrollView,
  I18nManager,
  StyleSheet,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import LiquidBackground from '@/components/LiquidBackground';
import { useLocalSearchParams } from 'expo-router';
import { cssInterop } from 'react-native-css-interop';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useSharedValue,
  useAnimatedScrollHandler,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { 
  ChevronRight, 
  ChevronLeft,
  Star,
  Clock,
  Ticket, 
  Heart,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Users,
  Film,
  Zap,
  Info
} from 'lucide-react-native';

import { Colors, Typography } from '@/constants/Theme';
import { Video } from '@/utils/SafeModules';
import MarkerHighlight from '@/components/MarkerHighlight';
import { Skeleton } from '@/components/Skeleton';
import { type Showtime } from '@/store/useBookingStore';
import { useMovieDetails } from '@/hooks/useMovieDetails';
import MovieTrailer from '@/components/MovieTrailer';
import { getImageSource, handleImageError } from '@/utils/ImageUtils';
import MovieReviews from '@/components/MovieReviews';
import ScrollEntrance from '@/components/ScrollEntrance';
import MovieTrivia from '@/components/MovieTrivia';

// Interop external components to support NativeWind className
cssInterop(LinearGradient, { className: 'style' });

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock showtimes for demonstration
const MOCK_SHOWTIMES: Showtime[] = [
  { id: '1', time: '14:00', format: 'רגיל', price: 45, hall: 'אולם 1' },
  { id: '2', time: '17:30', format: 'IMAX', price: 65, hall: 'אולם IMAX' },
  { id: '3', time: '20:00', format: 'רגיל', price: 45, hall: 'אולם 3' },
  { id: '4', time: '22:30', format: 'VIP', price: 85, hall: 'אולם VIP' },
];

export default function MovieDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  
  const {
    movie,
    cast,
    videos,
    loading,
    insights,
    scrollY,
    scrollHandler,
    headerAnimatedStyle,
    dates,
    selectedDate,
    selectedShowtime,
    user,
    themeColors,
    player,
    isGroupWatchActive,
    groupWatchRoomId,
    selectDate,
    handleSelectShowtime,
    handleBookSeats,
    handleTrailerPress,
    handleToggleFavorite,
    handleGroupWatchPress,
    handleBack,
  } = useMovieDetails(id);

  // States for images
  const [backdropSource, setBackdropSource] = useState<any>(null);
  const [posterSource, setPosterSource] = useState<any>(null);

  useEffect(() => {
    if (movie) {
      setBackdropSource(getImageSource(movie.backdrop_path, 'backdrop', 'original'));
      setPosterSource(getImageSource(movie.poster_path, 'poster', 'large'));
    }
  }, [movie]);

  // Reanimated style for poster parallax (floating upward effect)
  const posterAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 300],
      [0, -25],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }],
    };
  });

  // Reanimated style for layered parallax (3D depth text float)
  const textParallaxStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 300],
      [0, -10],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }],
    };
  });

  // Scroll Progress Tracking
  const scrollProgress = useSharedValue(0);
  const localScrollHandler = useAnimatedScrollHandler({
    onScroll: (event: any) => {
      scrollY.value = event.contentOffset.y;
      const totalScrollable = event.contentSize.height - event.layoutMeasurement.height;
      scrollProgress.value = totalScrollable > 0 ? event.contentOffset.y / totalScrollable : 0;
    }
  });

  // Scroll Progress Bar Animated Style (Uses high-performance transform scaleX & translateX)
  const progressBarStyle = useAnimatedStyle(() => {
    const scale = scrollProgress.value;
    const translation = I18nManager.isRTL 
      ? (1 - scale) * (SCREEN_WIDTH / 2) 
      : (scale - 1) * (SCREEN_WIDTH / 2);
    return {
      transform: [
        { scaleX: scale },
        { translateX: translation }
      ],
      width: '100%',
    };
  });

  // Reanimated style for sticky header
  const detailsHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [150, 280],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Dynamic VibeShift Animated Styles
  const progressBgStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: themeColors.accentShared.value,
    };
  });

  const storyLineStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: themeColors.primaryShared.value,
    };
  });

  const headerGlowStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: themeColors.primaryShared.value,
    };
  });

  if (loading || !movie) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <Skeleton height={280} borderRadius={0} />
        <View className="px-5 -mt-10">
          <View className="flex-row gap-4">
            <Skeleton width={120} height={180} borderRadius={16} />
            <View className="flex-1 justify-center">
              <Skeleton width="80%" height={32} style={{ marginBottom: 10 }} />
              <Skeleton width="50%" height={20} />
            </View>
          </View>
          <View className="mt-8">
            <Skeleton width={100} height={24} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={100} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Scroll-Progress Indicator Bar */}
      <Animated.View 
        style={[
          {
            position: 'absolute',
            top: insets.top,
            left: 0,
            height: 3,
            zIndex: 110,
          },
          progressBarStyle,
          progressBgStyle
        ]}
      />

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        onScroll={localScrollHandler}
        scrollEventThrottle={16}
      >
        {/* Header with Parallax */}
        <Animated.View className="h-[450px] w-full overflow-hidden" style={headerAnimatedStyle}>
          {/* Dynamic Liquid Glass Background */}
          <View className="absolute inset-0 bg-background">
            <LiquidBackground 
              primaryColor={themeColors.primary} 
              secondaryColor={themeColors.secondary} 
            />
            
            {backdropSource && (
              <Animated.View className="absolute inset-0 opacity-60">
                <Image
                  source={backdropSource}
                  className="w-full h-full"
                  resizeMode="cover"
                  onError={() => handleImageError(setBackdropSource, 'backdrop')}
                />
              </Animated.View>
            )}
            <BlurView intensity={100} tint="dark" className="absolute inset-0" />
          </View>

          {/* Cinematic Background Video Layer */}
          {Video?.VideoView && player ? (
            <Video.VideoView
              player={player}
              nativeControls={false}
              contentFit="cover"
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                opacity: 0.5,
                backgroundColor: 'transparent'
              }}
              pointerEvents="none"
            />
          ) : (
            <View className="absolute inset-0 bg-black/40" />
          )}

          <LinearGradient
            colors={['transparent', 'rgba(10,10,12,0.5)', Colors.background]}
            locations={[0, 0.7, 1]}
            className="absolute bottom-0 start-0 end-0 h-full"
            pointerEvents="none"
          />

          {videos.length > 0 && videos[0]?.key && (
            <Pressable 
              className="absolute inset-0 items-center justify-center bg-black/10"
              style={{ zIndex: 30 }}
              onPress={handleTrailerPress}
            >
              <Animated.View 
                entering={FadeIn.delay(800)}
                className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center border border-white/20"
              >
                <View className="me-1">
                  <ChevronLeft size={32} color="white" />
                </View>
              </Animated.View>
              <Text className="text-white font-display mt-4 text-h3 shadow-lg uppercase tracking-widest">צפה בטריילר המלא</Text>
            </Pressable>
          )}
        </Animated.View>

      {/* Sticky Top Header Bar with Movie Title */}
      <Animated.View 
        style={[
          { 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: insets.top + 64, 
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: insets.top,
          }, 
          detailsHeaderStyle
        ]}
      >
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)', height: '100%' }}>
          <Text 
            style={{ fontFamily: 'Rubik-Bold' }} 
            className="text-white text-base font-bold text-center px-24" 
            numberOfLines={1}
          >
            {movie.title}
          </Text>
        </View>
        <Animated.View 
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 1.5,
              opacity: 0.3,
            },
            headerGlowStyle
          ]}
        />
      </Animated.View>

      {/* Floating buttons */}
      <View className="absolute top-0 left-0 right-0 z-20">
        <Pressable
          className="absolute left-4"
          style={{ top: insets.top + 10 }}
          onPress={handleBack}
        >
          <BlurView intensity={30} tint="light" className="w-12 h-12 rounded-full overflow-hidden border border-white/20 items-center justify-center">
            <ChevronLeft size={28} color="white" />
          </BlurView>
        </Pressable>

        <Pressable
          className="absolute right-4"
          style={{ top: insets.top + 10 }}
          onPress={handleToggleFavorite}
        >
          <BlurView intensity={30} tint="light" className="w-12 h-12 rounded-full overflow-hidden border border-white/20 items-center justify-center">
            <Heart
              size={24}
              color={user?.watchlist.includes(movie?.id || 0) ? Colors.primary : "white"}
              fill={user?.watchlist.includes(movie?.id || 0) ? Colors.primary : 'transparent'}
            />
          </BlurView>
        </Pressable>

        <Pressable
          className="absolute right-20"
          style={{ top: insets.top + 10 }}
          onPress={handleGroupWatchPress}
        >
          <BlurView intensity={30} tint="light" className="w-12 h-12 rounded-full overflow-hidden border border-white/20 items-center justify-center">
            <Users
              size={24}
              color={isGroupWatchActive ? Colors.secondary : "white"}
            />
            {isGroupWatchActive && (
              <View className="absolute top-0 right-0 w-3 h-3 bg-secondary rounded-full border border-white" />
             )}
          </BlurView>
        </Pressable>
      </View>

      {/* Movie Info */}
      <Animated.View 
        entering={FadeIn.delay(200)} 
        style={textParallaxStyle}
        className="-mt-32 px-5"
      >
        <View 
          className="gap-6" 
          style={{ 
            flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          }}
        >
          {posterSource && (
            <Animated.View 
              entering={FadeInDown.delay(300).springify()}
              style={posterAnimatedStyle}
              className="shadow-2xl"
            >
              <Image
                source={posterSource}
                className="w-[140px] h-[210px] rounded-[24px] border-2 border-white/20"
                resizeMode="cover"
                onError={() => handleImageError(setPosterSource, 'poster')}
              />
            </Animated.View>
          )}
            <View 
              className="flex-1 justify-end pb-2"
              style={{
                alignItems: 'flex-start',
              }}
            >
              <Text 
                className="text-h1 text-white mb-2 font-display"
                style={{ writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr', textAlign: 'left', lineHeight: 42 }}
              >
                {movie.title}
              </Text>
              
              {movie.tagline ? (
                <Text
                  className="italic mt-1 leading-relaxed font-body opacity-90"
                  style={{ 
                    textAlign: 'left', 
                    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
                    color: themeColors.primary 
                  }}
                >
                  {movie.tagline}
                </Text>
              ) : null}

              <View 
                className="gap-3 mt-4"
                style={{
                  flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
                }}
              >
                <View className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                  <Text className="text-white text-xs font-bold">{movie.release_date.split('-')[0]}</Text>
                </View>
                <View 
                  className="px-3 py-1.5 rounded-xl border"
                  style={{ 
                    backgroundColor: `${themeColors.primary}33`,
                    borderColor: `${themeColors.primary}33`
                  }}
                >
                  <Text style={{ color: themeColors.primary }} className="text-xs font-bold">{movie.genres[0]?.name || 'כללי'}</Text>
                </View>
                
                {themeColors.moodNarrative ? (
                  <View 
                    className="px-3 py-1.5 rounded-xl border flex-row items-center gap-1.5"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
                    }}
                  >
                    <Sparkles size={12} color={themeColors.accent} />
                    <Text style={{ color: '#FFFFFF', fontFamily: 'Assistant-SemiBold' }} className="text-xs font-medium">
                      {themeColors.moodNarrative}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Quick Stats Bar */}
          <View className="flex-row justify-between items-center py-6 border-y border-white/5 mt-8 w-full">
            <View className="items-center flex-1">
              <Text className="text-textMuted text-[10px] mb-2 font-label uppercase tracking-widest">דירוג</Text>
              <View className="flex-row items-center">
                <Star size={18} color={Colors.secondary} fill={Colors.secondary} />
                <Text className="text-white font-display text-h3 ml-1.5">{movie.vote_average.toFixed(1)}</Text>
              </View>
            </View>
            <View className="w-[1px] h-10 bg-white/10" />
            <View className="items-center flex-1">
              <Text className="text-textMuted text-[10px] mb-2 font-label uppercase tracking-widest">אורך</Text>
              <View className="flex-row items-center">
                <Clock size={18} color={themeColors.primary} />
                <Text className="text-white font-display text-h3 ml-1.5">{movie.runtime}m</Text>
              </View>
            </View>
            <View className="w-[1px] h-10 bg-white/10" />
            <View className="items-center flex-1">
              <Text className="text-textMuted text-[10px] mb-2 font-label uppercase tracking-widest">שפה</Text>
              <Text className="text-white font-display text-h3 uppercase">{movie.original_language}</Text>
            </View>
          </View>
          {movie.overview ? (
            <ScrollEntrance scrollY={scrollY}>
              <View className="mt-8">
                <View 
                  className="w-full mb-4" 
                  style={{ 
                    paddingLeft: 16,
                    position: 'relative',
                    justifyContent: 'center',
                    minHeight: 24
                  }}
                >
                  <Animated.View 
                    style={[
                      { 
                        position: 'absolute',
                        start: 0,
                        top: '50%',
                        transform: [{ translateY: -12 }],
                        width: 6,
                        height: 24,
                        borderRadius: 999 
                      },
                      storyLineStyle
                    ]} 
                  />
                  <Text 
                    className="text-h2 text-white font-display"
                    style={{
                      textAlign: 'left',
                      writingDirection: 'ltr'
                    }}
                  >
                    סיפור הסרט
                  </Text>
                </View>
                <Text
                  style={{
                    ...Typography.body,
                    color: Colors.textSecondary,
                    lineHeight: 28,
                    textAlign: 'left',
                    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
                  }}
                  className="leading-loose"
                >
                  {movie.overview}
                </Text>
              </View>
            </ScrollEntrance>
          ) : null}

          {/* Trailer Discovery */}
          <MovieTrailer 
            movieId={movie.id} 
            backdropPath={movie.backdrop_path} 
            title={movie.title} 
          />


          {/* AI Insights */}
          {insights ? (
            <ScrollEntrance scrollY={scrollY}>
              <View 
                className="mt-8 p-6 rounded-[32px] border border-white/10 overflow-hidden relative"
              >
                <Animated.View 
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: themeColors.primaryShared.value,
                      opacity: 0.08,
                    }
                  ]}
                />
                <View className="flex-row items-center mb-6 gap-3" style={{ flexDirection: 'row' }}>
                  <View className="p-2 rounded-xl overflow-hidden relative">
                    <Animated.View 
                      style={[
                        StyleSheet.absoluteFill,
                        {
                          backgroundColor: themeColors.primaryShared.value,
                          opacity: 0.2,
                        }
                      ]}
                    />
                    <Sparkles size={20} color={themeColors.primary} />
                  </View>
                  <Text className="text-h2 text-white font-display">תובנות AI</Text>
                </View>

                <View className="space-y-4">
                  <View style={{ alignItems: 'flex-start' }}>
                    <View className="flex-row items-center mb-2 gap-2" style={{ flexDirection: 'row' }}>
                      <ThumbsUp size={16} color="#22c55e" />
                      <Text className="text-white font-bold font-body">מה אנחנו אוהבים:</Text>
                    </View>
                    {insights.pros.map((pro, index) => (
                      <Text key={index} className="text-textSecondary font-body mb-1" style={{ textAlign: 'left', writingDirection: 'ltr' }}>• {pro}</Text>
                    ))}
                  </View>

                  <View style={{ alignItems: 'flex-start' }} className="mt-4">
                    <View className="flex-row items-center mb-2 gap-2" style={{ flexDirection: 'row' }}>
                      <ThumbsDown size={16} color="#ef4444" />
                      <Text className="text-white font-bold font-body">פחות אהבנו:</Text>
                    </View>
                    {insights.cons.map((con, index) => (
                      <Text key={index} className="text-textSecondary font-body mb-1" style={{ textAlign: 'left', writingDirection: 'ltr' }}>• {con}</Text>
                    ))}
                  </View>

                  <View className="mt-6 pt-6 border-t border-white/5">
                    <Text style={{ color: themeColors.primary, textAlign: 'left', writingDirection: 'ltr' }} className="font-bold italic font-body leading-relaxed">
                      "{insights.verdict}"
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollEntrance>
          ) : null}

          {/* User & Community Reviews */}
          <ScrollEntrance scrollY={scrollY}>
            <MovieReviews movieId={movie.id} themeColors={themeColors} />
          </ScrollEntrance>

          {/* Director's Cut - Premium Feature */}
          <ScrollEntrance scrollY={scrollY}>
            <View 
              className="mt-8 overflow-hidden rounded-[32px] border border-white/5 bg-[#121214]" // Solid background
            >
              <View className="p-8">
                <View className="flex-row items-center mb-6 gap-4" style={{ flexDirection: 'row' }}>
                  <View className="p-3 bg-secondary/20 rounded-2xl">
                    <Film size={24} color={Colors.secondary} />
                  </View>
                  <View style={{ alignItems: 'flex-start' }}>
                    <Text className="text-h2 text-white font-display" style={{ textAlign: 'left', writingDirection: 'ltr' }}>גרסת הבמאי</Text>
                    <Text className="text-caption text-secondary/60 uppercase tracking-widest font-label" style={{ textAlign: 'left', writingDirection: 'ltr' }}>תובנות מאחורי הקלעים</Text>
                  </View>
                </View>

                <View className="flex-wrap gap-3 mb-8" style={{ flexDirection: 'row' }}>
                  <CutBadge icon={<Zap size={12} color="white" />} text="סצנות מורחבות" />
                  <CutBadge icon={<Star size={12} color="white" />} text="פרשנות שחקנים" />
                  <CutBadge icon={<Info size={12} color="white" />} text="שחזור 4K" />
                </View>

                <View className="bg-white/5 p-5 rounded-2xl border border-white/10" style={{ alignItems: 'flex-start' }}>
                  <Text className="text-body text-white/80 leading-relaxed font-body" style={{ textAlign: 'left', writingDirection: 'ltr' }}>
                    "ההפקה כללה מעל 200 סטים פיזיים והשתמשה בטכניקת תאורה מהפכנית כדי ללכוד את הזוהר הטבעי של הסביבה הקולנועית."
                  </Text>
                  <Text className="text-caption text-secondary font-bold mt-4 font-display" style={{ textAlign: 'left', writingDirection: 'ltr' }}>— סוד מההפקה</Text>
                </View>
              </View>
            </View>
          </ScrollEntrance>

          {/* Movie Trivia Challenge - Premium Feature */}
          <ScrollEntrance scrollY={scrollY}>
            <MovieTrivia movieTitle={movie.title} movieId={movie.id} themeColors={themeColors} />
          </ScrollEntrance>

          {/* Group Watch Status */}
          {isGroupWatchActive && (
            <Animated.View 
              entering={FadeInDown}
              className="mt-6 bg-secondary/10 border border-secondary/20 p-6 rounded-[28px]"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-secondary mr-2 animate-pulse" />
                  <Text className="text-secondary font-bold font-display">צפייה קבוצתית פעילה</Text>
                </View>
                <Text className="text-white/40 font-mono text-xs">חדר: {groupWatchRoomId}</Text>
              </View>
              <View className="flex-row items-center mt-4 gap-2">
                <View className="w-8 h-8 rounded-full bg-white/10 border border-white/20 items-center justify-center">
                  <Text className="text-white text-[10px]">JD</Text>
                </View>
                <View className="w-8 h-8 rounded-full bg-white/10 border border-white/20 items-center justify-center">
                  <Text className="text-white text-[10px]">AS</Text>
                </View>
                <Text className="text-white/40 text-xs ml-2">+3 חברים בחדר</Text>
              </View>
            </Animated.View>
          )}

          {cast.length > 0 ? (
            <ScrollEntrance scrollY={scrollY}>
              <View className="mt-2" style={{ alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start' }}>
                <MarkerHighlight text="שחקנים" className="text-h2 text-white mb-4" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingStart: 0, paddingEnd: 20, gap: 16 }}
                  className="flex-row"
                >
                  {cast.slice(0, 10).map((c) => (
                    <CastItem key={c.id} castMember={c} />
                  ))}
                </ScrollView>
              </View>
            </ScrollEntrance>
          ) : null}

          {/* Date Selection */}
          <ScrollEntrance scrollY={scrollY}>
            <View className="mt-8" style={{ alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start' }}>
              <MarkerHighlight text="בחירת תאריך" className="text-h2 text-white mb-4" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingStart: 0, paddingEnd: 20 }}
                className="flex-row"
              >
                {dates.map((d) => {
                  const isSelected = selectedDate === d.date;
                  return (
                    <Pressable
                      key={d.date}
                      onPress={() => selectDate(d.date)}
                      className={`items-center justify-center w-[65px] h-[75px] rounded-2xl ms-2 border overflow-hidden ${isSelected
                        ? 'border-transparent'
                        : 'bg-surfaceLight border-white/5'
                        }`}
                      style={isSelected ? {
                        backgroundColor: themeColors.primary,
                        shadowColor: themeColors.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 5
                      } : {}}
                    >
                      <Text className={`text-[10px] font-bold font-body uppercase tracking-wider ${isSelected ? 'text-background' : 'text-textMuted'}`}>
                        {d.dayName}
                      </Text>
                      <Text className={`text-h3 font-display mt-0.5 ${isSelected ? 'text-background' : 'text-white'}`}>
                        {d.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </ScrollEntrance>

          {/* Showtimes */}
          <ScrollEntrance scrollY={scrollY}>
            <View className="mt-7" style={{ alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start' }}>
              <View className="px-0 w-full" style={{ alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start' }}>
                <MarkerHighlight text="שעות הקרנה" className="text-h2 text-white mb-3" />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 0, gap: 12 }}
                className="flex-row"
              >
                {MOCK_SHOWTIMES.map((st) => {
                  const isSelected = selectedShowtime?.id === st.id;
                  return (
                    <Pressable
                      key={st.id}
                      onPress={() => handleSelectShowtime(st)}
                      className={`items-center py-4 px-6 rounded-[24px] border min-w-[120px] overflow-hidden ${isSelected
                        ? 'border-transparent'
                        : 'border-white/10'
                        }`}
                      style={[
                        { backgroundColor: isSelected ? themeColors.primary : 'rgba(255,255,255,0.03)' },
                        isSelected ? {
                          shadowColor: themeColors.primary,
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.3,
                          shadowRadius: 12,
                          elevation: 6
                        } : {}
                      ]}
                    >
                      <Text className={`text-h3 font-display ${isSelected ? 'text-background' : 'text-white'}`}>
                        {st.time}
                      </Text>
                      <Text className={`text-caption mt-0.5 font-body opacity-80 ${isSelected ? 'text-background' : 'text-textSecondary'}`}>
                        {st.format}
                      </Text>
                      <View className="px-3 py-1 rounded-full mt-2.5" style={{ backgroundColor: isSelected ? 'rgba(0,0,0,0.2)' : `${themeColors.primary}1A` }}>
                        <Text className={`text-[10px] font-bold font-display ${isSelected ? 'text-background' : ''}`} style={!isSelected ? { color: themeColors.primary } : {}}>
                          ₪{st.price}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </ScrollEntrance>
        </Animated.View>
      </Animated.ScrollView>

      {/* Floating Book CTA */}
      {selectedShowtime && (
        <Animated.View
          entering={FadeInDown.springify().damping(15)}
          className="absolute start-4 end-4 rounded-[28px] overflow-hidden border border-white/10"
          style={{
            bottom: insets.bottom + 12,
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 12
          }}
        >
          <View
            className="flex-row items-center justify-between px-6 py-4 bg-surface"
          >
            <Pressable
              onPress={handleBookSeats}
              className="rounded-2xl overflow-hidden"
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.96 : 1 }] }
              ]}
            >
              <LinearGradient
                colors={[themeColors.primary, themeColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center gap-2 px-8 py-3.5"
              >
                <Ticket size={20} color={Colors.background} />
                <Text className="text-background font-bold text-h3 font-display">הזמן מושבים</Text>
              </LinearGradient>
            </Pressable>

            <View className="gap-0 items-end">
              <Text className="text-h1 text-white font-display">₪{selectedShowtime.price}</Text>
              <Text className="text-caption text-textSecondary -mt-1 font-body">
                {selectedShowtime.time} • {selectedShowtime.format}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

/**
 * רכיב שחקן בודד לניהול מצב תמונה עצמאי
 */
function CastItem({ castMember }: { castMember: any }) {
  const [source, setSource] = useState(getImageSource(castMember.profile_path, 'profile', 'medium'));

  return (
    <View className="items-center w-20">
      <Image
        source={source}
        className="w-20 h-20 rounded-full border border-border"
        resizeMode="cover"
        onError={() => handleImageError(setSource, 'profile')}
      />
      <Text className="text-caption text-white mt-2 text-center font-body" numberOfLines={2}>
        {castMember.name}
      </Text>
    </View>
  );
}

function CutBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View className="items-center bg-white/10 px-3 py-1.5 rounded-full border border-white/10 gap-2" style={{ flexDirection: 'row' }}>
      {icon}
      <Text className="text-[10px] text-white font-bold font-label uppercase tracking-tighter" style={{ textAlign: 'left', writingDirection: 'ltr' }}>{text}</Text>
    </View>
  );
}


