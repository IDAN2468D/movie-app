/**
 * Movie Details Screen - Full cinematic details with booking flow
 */
import { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { BlurView } from 'expo-blur';
import LiquidBackground from '@/components/LiquidBackground';
import { useLocalSearchParams } from 'expo-router';
import { cssInterop } from 'react-native-css-interop';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { 
  ArrowRight, 
  Star, 
  Clock, 
  ChevronRight, 
  Ticket, 
  Heart,
  Sparkles,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react-native';

import { Colors, Typography, BACKDROP_SIZES, POSTER_SIZES } from '@/constants/Theme';
import MarkerHighlight from '@/components/MarkerHighlight';
import { Skeleton } from '@/components/Skeleton';
import { type Showtime } from '@/store/useBookingStore';
import { useMovieDetails } from '@/hooks/useMovieDetails';

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
    dates,
    selectedDate,
    selectedShowtime,
    user,
    selectDate,
    handleSelectShowtime,
    handleBookSeats,
    handleTrailerPress,
    handleToggleFavorite,
    handleBack,
  } = useMovieDetails(id);

  const player = useVideoPlayer('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(
            scrollY.value,
            [-200, 0],
            [1.5, 1],
            Extrapolation.CLAMP
          ),
        },
        {
          translateY: interpolate(
            scrollY.value,
            [-200, 0, 200],
            [0, 0, 100],
            Extrapolation.CLAMP
          ),
        },
      ],
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
      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 280 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Header with Parallax */}
        <Animated.View className="h-[450px] w-full overflow-hidden" style={headerAnimatedStyle}>
          {/* Dynamic Liquid Glass Background */}
          <View className="absolute inset-0 bg-background">
            <LiquidBackground movieColor={Colors.primary} />
            
            {movie.backdrop_path && (
              <Animated.View className="absolute inset-0 opacity-60">
                <Image
                  source={{ uri: `${BACKDROP_SIZES.large}${movie.backdrop_path}` }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </Animated.View>
            )}
            <BlurView intensity={100} tint="dark" className="absolute inset-0" />
          </View>

          {/* Cinematic Background Video Layer */}
          <VideoView
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
                <View className="ms-1">
                  <ArrowRight size={32} color="white" style={{ transform: [{ rotate: '180deg' }] }} />
                </View>
              </Animated.View>
              <Text className="text-white font-display mt-4 text-h3 shadow-lg uppercase tracking-widest">צפה בטריילר המלא</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Floating buttons */}
        <View className="absolute top-0 start-0 end-0 z-20">
          <Pressable
            className="absolute start-4"
            style={{ top: insets.top + 10 }}
            onPress={handleBack}
          >
            <BlurView intensity={30} tint="light" className="w-12 h-12 rounded-full overflow-hidden border border-white/20 items-center justify-center">
              <ChevronRight size={28} color="white" />
            </BlurView>
          </Pressable>

          <Pressable
            className="absolute end-4"
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
        </View>

        {/* Movie Info */}
        <Animated.View entering={FadeIn.delay(200)} className="-mt-32 px-5">
          <View className="flex-row-reverse gap-6">
            {movie.poster_path && (
              <Animated.View 
                entering={FadeInDown.delay(300).springify()}
                className="shadow-2xl"
              >
                <Image
                  source={{ uri: `${POSTER_SIZES.medium}${movie.poster_path}` }}
                  className="w-[140px] h-[210px] rounded-[24px] border-2 border-white/20"
                  resizeMode="cover"
                />
              </Animated.View>
            )}
            <View className="flex-1 justify-end items-start pb-2">
              <Text 
                className="text-h1 text-white mb-2 text-left font-display"
                style={{ writingDirection: 'ltr', lineHeight: 42 }}
              >
                {movie.title}
              </Text>
              
              {movie.tagline ? (
                <Text
                  className="text-primary italic mt-1 leading-relaxed text-left font-body opacity-90"
                  style={{ textAlign: 'left', writingDirection: 'ltr' }}
                >
                  {movie.tagline}
                </Text>
              ) : null}

              <View className="flex-row-reverse gap-3 mt-4">
                <View className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                  <Text className="text-white text-xs font-bold">{movie.release_date.split('-')[0]}</Text>
                </View>
                <View className="bg-primary/20 px-3 py-1.5 rounded-xl border border-primary/20">
                  <Text className="text-primary text-xs font-bold">{movie.genres[0]?.name || 'כללי'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Stats Bar */}
          <View className="flex-row-reverse justify-between items-center py-6 border-y border-white/5 mt-8 w-full">
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
                <Clock size={18} color={Colors.primary} />
                <Text className="text-white font-display text-h3 ml-1.5">{movie.runtime}m</Text>
              </View>
            </View>
            <View className="w-[1px] h-10 bg-white/10" />
            <View className="items-center flex-1">
              <Text className="text-textMuted text-[10px] mb-2 font-label uppercase tracking-widest">שפה</Text>
              <Text className="text-white font-display text-h3 uppercase">{movie.original_language}</Text>
            </View>
          </View>

          {/* Overview */}
          {movie.overview ? (
            <View className="mt-8">
              <View className="flex-row items-center mb-4">
                <View className="w-1.5 h-6 bg-primary rounded-full mr-3" />
                <Text className="text-h2 text-white font-display">סיפור הסרט</Text>
              </View>
              <Text
                style={{
                  ...Typography.body,
                  color: Colors.textSecondary,
                  lineHeight: 28,
                  textAlign: 'left',
                  writingDirection: 'ltr',
                }}
                className="leading-loose"
              >
                {movie.overview}
              </Text>
            </View>
          ) : null}


          {/* AI Insights */}
          {insights ? (
            <Animated.View entering={FadeInDown.delay(400)} className="mt-8 bg-primary/5 p-6 rounded-[32px] border border-primary/10">
              <View className="flex-row items-center mb-6">
                <View className="bg-primary/20 p-2 rounded-xl mr-3">
                  <Sparkles size={20} color={Colors.primary} />
                </View>
                <Text className="text-h2 text-white font-display text-left">תובנות AI</Text>
              </View>

              <View className="space-y-4">
                <View className="items-start">
                  <View className="flex-row items-center mb-2">
                    <ThumbsUp size={16} color="#22c55e" className="mr-2" />
                    <Text className="text-white font-bold font-body">מה אנחנו אוהבים:</Text>
                  </View>
                  {insights.pros.map((pro, index) => (
                    <Text key={index} className="text-textSecondary text-left font-body mb-1">• {pro}</Text>
                  ))}
                </View>

                <View className="items-start mt-4">
                  <View className="flex-row items-center mb-2">
                    <ThumbsDown size={16} color="#ef4444" className="mr-2" />
                    <Text className="text-white font-bold font-body">פחות אהבנו:</Text>
                  </View>
                  {insights.cons.map((con, index) => (
                    <Text key={index} className="text-textSecondary text-left font-body mb-1">• {con}</Text>
                  ))}
                </View>

                <View className="mt-6 pt-6 border-t border-white/5">
                  <Text className="text-primary font-bold italic text-left font-body leading-relaxed">
                    "{insights.verdict}"
                  </Text>
                </View>
              </View>
            </Animated.View>
          ) : null}

          {/* Cast */}
          {cast.length > 0 ? (
            <View className="mt-2 items-end">
              <MarkerHighlight text="שחקנים" className="text-h2 text-white mb-4 text-right" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingStart: 0, paddingEnd: 20, gap: 16 }}
                className="flex-row"
              >
                {cast.slice(0, 10).map((c) => (
                  <View key={c.id} className="items-center w-20">
                    <Image
                      source={c.profile_path ? { uri: `${POSTER_SIZES.small}${c.profile_path}` } : require('../../assets/images/default-avatar.png')}
                      className="w-20 h-20 rounded-full border border-border"
                      resizeMode="cover"
                    />
                    <Text className="text-caption text-white mt-2 text-center font-body" numberOfLines={2}>
                      {c.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Date Selection */}
          <View className="mt-8 items-start">
            <MarkerHighlight text="בחירת תאריך" className="text-h2 text-white mb-4 text-right" />
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
                      ? 'bg-primary border-primary'
                      : 'bg-surfaceLight border-white/5'
                      }`}
                    style={isSelected ? {
                      shadowColor: Colors.primary,
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

          {/* Showtimes */}
          <View className="mt-7 items-end">
            <View className="px-0 w-full items-end">
              <MarkerHighlight text="שעות הקרנה" className="text-h2 text-white mb-3 text-right" />
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
                      ? 'border-primary'
                      : 'border-white/10'
                      }`}
                    style={[
                      { backgroundColor: isSelected ? Colors.primary : 'rgba(255,255,255,0.03)' },
                      isSelected ? {
                        shadowColor: Colors.primary,
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
                    <View className={`px-3 py-1 rounded-full mt-2.5 ${isSelected ? 'bg-background/20' : 'bg-primary/10'}`}>
                      <Text className={`text-[10px] font-bold font-display ${isSelected ? 'text-background' : 'text-primary'}`}>
                        ₪{st.price}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
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
            className="flex-row-reverse items-center justify-between px-6 py-4 bg-surface"
          >
            <View className="gap-0 items-end">
              <Text className="text-h1 text-white font-display">₪{selectedShowtime.price}</Text>
              <Text className="text-caption text-textSecondary -mt-1 font-body">
                {selectedShowtime.time} • {selectedShowtime.format}
              </Text>
            </View>
            
            <Pressable
              onPress={handleBookSeats}
              className="rounded-2xl overflow-hidden"
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.96 : 1 }] }
              ]}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row-reverse items-center gap-2 px-8 py-3.5"
              >
                <Ticket size={20} color={Colors.background} />
                <Text className="text-background font-bold text-h3 font-display">הזמן מושבים</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
