/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  Image,
  StyleSheet,
  Linking,
  type ViewToken,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Star, Bookmark, Film } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeIn, 
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useBookingStore } from '@/store/useBookingStore';
import { getImageSource, handleImageError } from '@/utils/ImageUtils';
import { getMovieVideos, getGenreName, type TMDBMovie, type TMDBVideo } from '@/lib/tmdb';
import { cssInterop } from 'react-native-css-interop';

// Required for NativeWind v4 compatibility with Expo components
cssInterop(BlurView, { className: 'style' });
cssInterop(LinearGradient, { className: 'style' });

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CinematicFeedProps {
  movies: TMDBMovie[];
}

export default function CinematicFeed({ movies }: CinematicFeedProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    minimumViewTime: 100,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      const newIndex = viewableItems[0].index;
      setActiveIndex(newIndex);
      // Trigger subtle haptic click on paging transition
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }).current;

  const renderItem = useCallback(({ item, index }: { item: TMDBMovie; index: number }) => {
    return (
      <CinematicFeedItem
        movie={item}
        isActive={index === activeIndex}
      />
    );
  }, [activeIndex]);

  if (movies.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="text-white/60 font-assistant text-base mt-4 text-center">אין סרטים להצגה</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={movies}
        renderItem={renderItem}
        keyExtractor={(item) => `cine-${item.id}`}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        disableIntervalMomentum
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        // Performance optimizations
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={2}
        removeClippedSubviews
      />
    </View>
  );
}

// Helper to resolve optimized, direct MP4 video loops mapped by movie genre
function getDirectTrailerUrl(movie: TMDBMovie): string {
  // Using ultra-lightweight 2MB-3MB optimized loops for instant buffering on mobile networks
  const videos = {
    sciFi: 'https://vjs.zencdn.net/v/oceans.mp4',
    animation: 'https://www.w3schools.com/html/mov_bbb.mp4',
    action: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    adventure: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
    comedy: 'https://www.w3schools.com/html/movie.mp4',
    drama: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
  };

  if (!movie.genre_ids || movie.genre_ids.length === 0) {
    return videos.drama;
  }

  const mainGenre = movie.genre_ids[0];
  // TMDB Genres: 878 = Science Fiction, 16 = Animation, 28 = Action, 12 = Adventure, 35 = Comedy, 18 = Drama
  if (mainGenre === 878) return videos.sciFi;
  if (mainGenre === 16) return videos.animation;
  if (mainGenre === 28) return videos.action; // Action genre mapped to ForBiggerBlazes
  if (mainGenre === 12) return videos.adventure;
  if (mainGenre === 35) return videos.comedy;
  return videos.drama;
}

interface CinematicFeedItemProps {
  movie: TMDBMovie;
  isActive: boolean;
}

const CinematicFeedItem = React.memo(function CinematicFeedItem({ movie, isActive }: CinematicFeedItemProps) {
  const insets = useSafeAreaInsets();
  const selectMovie = useBookingStore((state) => state.selectMovie);

  // Watchlist & Bookmark selectors
  const isBookmarked = useWatchlistStore((state) => state.movies.some((m) => m.id === movie.id));
  const addToWatchlist = useWatchlistStore((state) => state.addToWatchlist);
  const removeFromWatchlist = useWatchlistStore((state) => state.removeFromWatchlist);
  const toggleFavorite = useAuthStore((state) => state.toggleFavorite);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Background state & Video trailer fetching
  const [backdropSrc, setBackdropSrc] = useState(getImageSource(movie.backdrop_path, 'backdrop', 'original'));
  const [video, setVideo] = useState<TMDBVideo | null>(null);



  // Refresh image source if movie changes
  useEffect(() => {
    setBackdropSrc(getImageSource(movie.backdrop_path, 'backdrop', 'original'));
  }, [movie.backdrop_path]);

  // Fetch YouTube trailer dynamically when active
  useEffect(() => {
    if (isActive) {
      getMovieVideos(movie.id)
        .then((videos) => {
          const trailer =
            videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
            videos.find((v) => v.site === 'YouTube');
          if (trailer) {
            setVideo(trailer);
          } else {
            setVideo(null);
          }
        })
        .catch(() => {
          setVideo(null);
        });
    }
  }, [movie.id, isActive]);

  const handleBookNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectMovie(movie.id, movie.title, movie.poster_path || '');
    router.push(`/movie/${movie.id}`);
  };

  const handleOpenTrailer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (video) {
      Linking.openURL(`https://www.youtube.com/watch?v=${video.key}`).catch((err) => {
        console.error('Failed to open trailer URL:', err);
      });
    }
  };

  const handleToggleBookmark = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isBookmarked) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }

    if (isAuthenticated) {
      toggleFavorite(movie.id);
    }
  };

  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : '';
  const genreName = movie.genre_ids && movie.genre_ids.length > 0 ? getGenreName(movie.genre_ids[0]) : '';

  // Tab bar height calculation to position the Thumb Card perfectly above it
  const tabHeight = 68 + (insets.bottom > 0 ? insets.bottom : 20);
  const bottomMargin = tabHeight + 16;

  return (
    <View style={[styles.itemContainer, { height: SCREEN_HEIGHT }]}>
      {/* Absolute Background Video / Poster Backdrop with smooth cross-fade */}
      <View style={StyleSheet.absoluteFill}>
        {/* Base Poster Backdrop - Always rendered to ensure no black screens under any circumstance */}
        <Image
          source={backdropSrc}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={handleImageError(setBackdropSrc, 'backdrop')}
        />

      </View>

      {/* Glass Overlay Dark Gradients */}
      <LinearGradient
        colors={['rgba(9,9,11,0.8)', 'rgba(9,9,11,0.15)', 'rgba(9,9,11,0.92)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Center Trailer Button Overlay */}
      {video && (
        <View style={styles.centerPlayWrapper}>
          <Pressable
            onPress={handleOpenTrailer}
            className="w-16 h-16 rounded-full bg-black/40 items-center justify-center border border-white/20 active:scale-90"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10 }}
          >
            <Play size={28} color={Colors.secondary} fill={Colors.secondary} className="ms-1" />
          </Pressable>
          <Text
            className="text-secondary text-[11px] font-bold mt-2 tracking-widest text-center"
            style={{ fontFamily: 'Rubik-Bold' }}
          >
            צפה בטריילר
          </Text>
        </View>
      )}


      {/* Bottom Panel anchored in Thumb Zone */}
      <View style={[styles.cardContainer, { bottom: bottomMargin }]}>
        <BlurView
          intensity={40}
          tint="dark"
          className="rounded-[32px] overflow-hidden border border-white/10"
        >
          <View className="p-6">
            {/* Meta Tag Badges Row */}
            <View className="flex-row items-center justify-start gap-2 mb-3">
              {/* Rating */}
              <View className="flex-row items-center bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                <Star size={12} color={Colors.secondary} fill={Colors.secondary} />
                <Text className="text-secondary text-[12px] font-bold ms-1" style={{ fontFamily: 'Rubik-Bold' }}>
                  {movie.vote_average.toFixed(1)}
                </Text>
              </View>

              {/* Release Year */}
              {releaseYear !== '' && (
                <View className="bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                  <Text className="text-white/80 text-[12px]" style={{ fontFamily: 'Assistant-SemiBold' }}>
                    {releaseYear}
                  </Text>
                </View>
              )}

              {/* First Genre Tag */}
              {genreName !== '' && (
                <View className="bg-primary/20 px-2.5 py-1 rounded-lg border border-primary/20">
                  <Text className="text-primary text-[12px]" style={{ fontFamily: 'Assistant-SemiBold' }}>
                    {genreName}
                  </Text>
                </View>
              )}
            </View>

            {/* Movie Title (LTR Aligned) */}
            <Text
              className="text-white text-2xl font-bold mb-2.5 text-left font-display"
              numberOfLines={2}
              style={{ writingDirection: 'ltr', textAlign: 'left' }}
            >
              {movie.title}
            </Text>

            {/* Movie Description (LTR Aligned) */}
            <Text
              className="text-textSecondary text-[14px] leading-5 text-left font-assistant mb-6"
              numberOfLines={3}
              style={{
                writingDirection: 'ltr',
                textAlign: 'left',
              }}
            >
              {movie.overview || 'אין תיאור זמין עבור סרט זה בעברית.'}
            </Text>

            {/* Interactive Actions Row */}
            <View className="flex-row items-center gap-3">
              {/* Secondary CTA: Watch Trailer */}
              {video ? (
                <Pressable
                  onPress={handleOpenTrailer}
                  className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 items-center justify-center active:scale-95"
                >
                  <Film size={20} color="white" />
                </Pressable>
              ) : (
                <View className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 opacity-40 items-center justify-center">
                  <Film size={20} color="white" />
                </View>
              )}

              {/* Dynamic Watchlist Toggle Button */}
              <Pressable
                onPress={handleToggleBookmark}
                className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 items-center justify-center active:scale-95"
              >
                <Bookmark
                  size={20}
                  color={isBookmarked ? Colors.primary : 'white'}
                  fill={isBookmarked ? Colors.primary : 'transparent'}
                />
              </Pressable>

              {/* Primary CTA Button: Book Now */}
              <Pressable
                onPress={handleBookNow}
                className="flex-1 h-14 rounded-2xl overflow-hidden active:scale-[0.98] shadow-lg" style={{ shadowColor: Colors.primary, shadowOpacity: 0.2 }}
              >
                <LinearGradient
                  colors={[Colors.primary, '#9B1B30']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full h-full items-center justify-center"
                >
                  <Text className="text-white text-base font-bold" style={{ fontFamily: 'Rubik-Bold' }}>
                    הזמן כרטיס עכשיו
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </BlurView>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  itemContainer: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
  },
  centerPlayWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    top: SCREEN_HEIGHT * 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 20,
  },

});
