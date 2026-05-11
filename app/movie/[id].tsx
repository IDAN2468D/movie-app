/**
 * Movie Details Screen - Full cinematic details with booking flow
 */
import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { cssInterop } from 'react-native-css-interop';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { 
  ArrowRight, 
  Star, 
  Clock, 
  Calendar, 
  ChevronRight, 
  Ticket, 
  Heart 
} from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';

import { Colors, Typography, BACKDROP_SIZES, POSTER_SIZES } from '@/constants/Theme';
import MarkerHighlight from '@/components/MarkerHighlight';
import { Skeleton } from '@/components/Skeleton';
import {
  getMovieDetails,
  getMovieCredits,
  getGenreName,
  getMovieVideos,
  type TMDBMovieDetails,
  type TMDBCast,
  type TMDBVideo,
} from '@/lib/tmdb';
import { useBookingStore, type Showtime } from '@/store/useBookingStore';
import { useAuthStore } from '@/store/useAuthStore';

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

function getNext7Days(): { label: string; date: string; dayName: string }[] {
  const days = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''];
  const result = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    result.push({
      label: d.getDate().toString(),
      date: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'היום' : i === 1 ? 'מחר' : days[d.getDay()],
    });
  }
  return result;
}

export default function MovieDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 1. Optimized Selectors
  const selectMovie = useBookingStore(state => state.selectMovie);
  const selectDate = useBookingStore(state => state.selectDate);
  const selectShowtime = useBookingStore(state => state.selectShowtime);
  const selectedDate = useBookingStore(state => state.selectedDate);
  const selectedShowtime = useBookingStore(state => state.selectedShowtime);

  const { user, toggleFavorite } = useAuthStore();

  const [movie, setMovie] = useState<TMDBMovieDetails | null>(null);
  const [cast, setCast] = useState<TMDBCast[]>([]);
  const [videos, setVideos] = useState<TMDBVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  const player = useVideoPlayer('https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-out-of-focus-31640-large.mp4', player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });
  // 2. Parallax Animation Values
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
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

  // 3. Memoized dates
  const dates = useMemo(() => getNext7Days(), []);

  useEffect(() => {
    if (!id) return;
    const movieId = parseInt(id, 10);

    let isMounted = true;

    Promise.all([
      getMovieDetails(movieId), 
      getMovieCredits(movieId),
      getMovieVideos(movieId)
    ])
      .then(([details, credits, videoData]) => {
        if (!isMounted) return;
        setMovie(details);
        setCast(credits);
        setVideos(videoData.filter(v => v.site === 'YouTube' && v.type === 'Trailer'));

        selectMovie(movieId, details.title, details.poster_path || '');
        if (!selectedDate) {
          selectDate(dates[0].date);
        }
      })
      .catch(err => {
        console.error('Failed to load movie details:', err);
      })
      .finally(() => {
        if (isMounted) {
          setTimeout(() => setLoading(false), 300);
        }
      });

    return () => { isMounted = false; };
  }, [id, selectMovie, selectDate, dates]);

  const handleSelectShowtime = (showtime: Showtime) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectShowtime(showtime);
  };

  const handleBookSeats = () => {
    if (!selectedShowtime) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/movie/seats');
  };

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
        <Animated.View className="h-80 w-full overflow-hidden" style={headerAnimatedStyle}>
          {movie.backdrop_path && (
            <Image
              source={{ uri: `${BACKDROP_SIZES.large}${movie.backdrop_path}` }}
              className="w-full h-full"
              resizeMode="cover"
            />
          )}
          
          {/* Cinematic Background Video (Liquid Glass) */}
          <VideoView
            player={player}
            nativeControls={false}
            contentFit="cover"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3 }}
          />

          {videos.length > 0 && (
            <Pressable 
              className="absolute inset-0 items-center justify-center bg-black/20"
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                await WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${videos[0].key}`);
              }}
            >
              <View className="w-16 h-16 rounded-full bg-primary/80 items-center justify-center border-4 border-white/20">
                <View className="ms-1">
                  <ArrowRight size={32} color="white" style={{ transform: [{ rotate: '180deg' }] }} />
                </View>
              </View>
              <Text className="text-white font-display mt-3 text-h3 shadow-lg">צפה בטריילר</Text>
            </Pressable>
          )}
          <LinearGradient
            colors={['transparent', Colors.background]}
            locations={[0.4, 1]}
            className="absolute bottom-0 start-0 end-0 h-[60%]"
          />
        </Animated.View>

        {/* Floating buttons */}
        <View className="absolute top-0 start-0 end-0 z-20">
          <Pressable
            className="absolute start-4"
            style={{ top: insets.top + 10 }}
            onPress={() => router.back()}
          >
            <View className="w-10 h-10 rounded-full justify-center items-center overflow-hidden border border-white/10 bg-surfaceLight">
              <ChevronRight size={24} color={Colors.text} />
            </View>
          </Pressable>

          <Pressable
            className="absolute end-4"
            style={{ top: insets.top + 10 }}
            onPress={() => {
              if (movie) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleFavorite(movie.id);
              }
            }}
          >
            <View className="w-10 h-10 rounded-full justify-center items-center overflow-hidden border border-white/10 bg-surfaceLight">
              <Heart
                size={22}
                color={user?.watchlist.includes(movie?.id || 0) ? Colors.primary : Colors.text}
                fill={user?.watchlist.includes(movie?.id || 0) ? Colors.primary : 'transparent'}
              />
            </View>
          </Pressable>
        </View>

        {/* Movie Info */}
        <Animated.View entering={FadeIn.delay(200)} className="-mt-10 px-5">
          <View className="flex-row-reverse gap-4">
            {movie.poster_path && (
              <Image
                source={{ uri: `${POSTER_SIZES.medium}${movie.poster_path}` }}
                className="w-[120px] h-[180px] rounded-2xl border-2 border-white/10 shadow-2xl"
                resizeMode="cover"
              />
            )}
            <View className="flex-1 justify-center items-start">
              <MarkerHighlight
                text={movie.title}
                className="text-h1 text-white mb-2 text-left"
                color={Colors.primary}
              />
              {movie.tagline ? (
                <Text
                  className="text-primary italic mt-1 leading-relaxed text-left font-body"
                  style={[Typography.body, { textAlign: 'left' }]}
                >
                  {movie.tagline}
                </Text>
              ) : null}
              <View className="flex-row-reverse justify-between items-center py-4 border-y border-white/5 mt-6 w-full">
                <View className="items-center">
                  <Text className="text-textMuted text-xs mb-1 font-label">דירוג</Text>
                  <View className="flex-row items-center">
                    <Star size={16} color={Colors.secondary} />
                    <Text className="text-white font-bold ml-1">{movie.vote_average.toFixed(1)}</Text>
                  </View>
                </View>
                <View className="w-[1px] h-8 bg-white/10" />
                <View className="items-center">
                  <Text className="text-textMuted text-xs mb-1 font-label">אורך</Text>
                  <Text className="text-white font-bold">{movie.runtime} דק׳</Text>
                </View>
                <View className="w-[1px] h-8 bg-white/10" />
                <View className="items-center">
                  <Text className="text-textMuted text-xs mb-1 font-label">ז׳אנר</Text>
                  <Text className="text-white font-bold" numberOfLines={1}>{movie.genres[0]?.name || 'כללי'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Overview */}
          {movie.overview ? (
            <View className="mt-7">
              <MarkerHighlight text="תקציר" className="text-h2 text-white mb-3 text-right" />
              <Text
                style={{
                  ...Typography.body,
                  color: Colors.textSecondary,
                  marginBottom: 24,
                  textAlign: 'left',
                  writingDirection: 'rtl',
                  alignSelf: 'stretch',
                  width: '100%'
                }}
                className="w-full"
                numberOfLines={6}
                ellipsizeMode="tail"
              >
                {movie.overview}
              </Text>
            </View>
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
                      source={{ uri: c.profile_path ? `${POSTER_SIZES.small}${c.profile_path}` : 'https://via.placeholder.com/150' }}
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
