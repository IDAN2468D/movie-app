import { useEffect, useState, useMemo } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolation 
} from 'react-native-reanimated';
import { useBookingStore, type Showtime } from '@/store/useBookingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { usePremiumStore } from '@/store/usePremiumStore';
import { useMovieTheme } from '@/hooks/useMovieTheme';
import { AIService } from '@/services/AIService';
import { Video } from '@/utils/SafeModules';
import { type TMDBMovie } from '@/lib/tmdb';
import { 
  useMovieDetails as useMovieQuery, 
  useMovieCredits, 
  useMovieVideos 
} from '@/hooks/useMovieQueries';

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

function getDirectTrailerUrl(movie: any): string {
  // Specific movie ID mapping for customized cinematic loops (Expo Video requires direct MP4/HLS streams)
  const movieId = movie.id;
  if (movieId) {
    if (movieId === 693134) {
      // Dune: Part Two - Panoramic cinematic nature
      return 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4';
    } else if (movieId === 872585) {
      // Oppenheimer - High-contrast dramatic trailer
      return 'https://media.w3.org/2010/05/sintel/trailer.mp4';
    } else if (movieId === 569094) {
      // Spider-Man: Across the Spider-Verse - Colorful animation
      return 'https://www.w3schools.com/html/mov_bbb.mp4';
    } else if (movieId === 414906) {
      // The Batman - Dark moody atmosphere
      return 'https://vjs.zencdn.net/v/oceans.mp4';
    } else if (movieId === 157336) {
      // Interstellar - Atmospheric space/ocean vibe
      return 'https://vjs.zencdn.net/v/oceans.mp4';
    } else if (movieId === 329) {
      // Jurassic World: Chaos Theory - Wilderness loop
      return 'https://www.w3schools.com/html/movie.mp4';
    }
  }

  const videos = {
    sciFi: 'https://vjs.zencdn.net/v/oceans.mp4',
    animation: 'https://www.w3schools.com/html/mov_bbb.mp4',
    action: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    adventure: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
    comedy: 'https://www.w3schools.com/html/movie.mp4',
    drama: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
  };

  const genreIds = movie.genre_ids || movie.genres?.map((g: any) => g.id) || [];
  if (genreIds.length === 0) {
    return videos.drama;
  }

  const mainGenre = genreIds[0];
  if (mainGenre === 878) return videos.sciFi;
  if (mainGenre === 16) return videos.animation;
  if (mainGenre === 28) return videos.action;
  if (mainGenre === 12) return videos.adventure;
  if (mainGenre === 35) return videos.comedy;
  return videos.drama;
}

export const useMovieDetails = (id: string | undefined) => {
  const movieId = id ? parseInt(id, 10) : 0;

  // 1. Store State
  const selectMovie = useBookingStore(state => state.selectMovie);
  const selectDate = useBookingStore(state => state.selectDate);
  const selectShowtime = useBookingStore(state => state.selectShowtime);
  const selectedDate = useBookingStore(state => state.selectedDate);
  const selectedShowtime = useBookingStore(state => state.selectedShowtime);
  const { user, toggleFavorite } = useAuthStore();
  const { isGroupWatchActive, startGroupWatch, stopGroupWatch, groupWatchRoomId } = usePremiumStore();

  // 2. React Query Hooks
  const { data: movie, isLoading: isMovieLoading } = useMovieQuery(movieId);
  const { data: cast = [], isLoading: isCastLoading } = useMovieCredits(movieId);
  const { data: rawVideos = [], isLoading: isVideosLoading } = useMovieVideos(movieId);

  const [insights, setInsights] = useState<{ pros: string[]; cons: string[]; verdict: string } | null>(null);

  // Filter and prioritize videos
  const videos = useMemo(() => {
    const movieVideos = rawVideos.filter(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
    return movieVideos.length > 0 ? movieVideos : rawVideos.filter(v => v.site === 'YouTube');
  }, [rawVideos]);

  const loading = isMovieLoading || isCastLoading || isVideosLoading;

  // 3. UI Hooks integration
  const themeColors = useMovieTheme(movie as any);

  // Background Video Player playing the cinematic loop matching the movie's genre
  const directTrailerUrl = movie ? getDirectTrailerUrl(movie) : '';
  const player = Video.useVideoPlayer(directTrailerUrl || null, (p: any) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Dynamically replace player source when movie data is loaded
  useEffect(() => {
    let active = true;
    const updateSource = async () => {
      if (player && directTrailerUrl && active) {
        const currentSource = typeof player.source === 'string' ? player.source : player.source?.uri;
        if (currentSource !== directTrailerUrl) {
          try {
            if (typeof player.replaceAsync === 'function') {
              await player.replaceAsync(directTrailerUrl);
            } else if (typeof player.replace === 'function') {
              player.replace(directTrailerUrl);
            } else {
              player.source = directTrailerUrl;
            }
          } catch (err) {
            console.error('Failed to replace video source:', err);
            try {
              player.source = directTrailerUrl;
            } catch (fallbackErr) {
              console.error('Fallback source assignment failed:', fallbackErr);
            }
          }
        }
      }
    };

    updateSource();
    return () => {
      active = false;
    };
  }, [player, directTrailerUrl]);

  // 4. Animation State
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

  // 5. Memoized Data
  const dates = useMemo(() => getNext7Days(), []);

  // 6. Side Effects (AI Insights, Store Sync)
  useEffect(() => {
    if (movie) {
      selectMovie(movieId, movie.title, movie.poster_path || '');
      if (!selectedDate) {
        selectDate(dates[0].date);
      }
      
      // Fetch AI Insights only once per movie
      AIService.getMovieInsights(movie.title, movie.overview).then(setInsights);
    }
  }, [movie, movieId, selectMovie, selectDate, selectedDate, dates]);

  // 7. Action Handlers
  const handleSelectShowtime = (showtime: Showtime) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectShowtime(showtime);
  };

  const handleBookSeats = () => {
    if (!selectedShowtime) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/movie/seats');
  };

  const handleTrailerPress = async () => {
    if (videos.length > 0 && videos[0]?.key) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const url = `https://www.youtube.com/watch?v=${videos[0].key}`;
        await WebBrowser.openBrowserAsync(url);
      } catch (error) {
        console.error('Failed to open trailer:', error);
      }
    }
  };

  const handleToggleFavorite = () => {
    if (movie) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // 1. Sync remote watchlist
      toggleFavorite(movie.id);
      
      // 2. Sync local watchlist store
      const watchlistStore = useWatchlistStore.getState();
      if (watchlistStore.isInWatchlist(movie.id)) {
        watchlistStore.removeFromWatchlist(movie.id);
      } else {
        const tmdbMovie: TMDBMovie = {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date || '',
          genre_ids: movie.genres?.map((g: any) => g.id) || [],
          overview: movie.overview,
          popularity: movie.popularity,
          vote_count: movie.vote_count,
        };
        watchlistStore.addToWatchlist(tmdbMovie);
      }
    }
  };

  const handleGroupWatchPress = () => {
    if (isGroupWatchActive) {
      stopGroupWatch();
    } else {
      const roomId = Math.random().toString(36).substring(7).toUpperCase();
      startGroupWatch(roomId);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return {
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
  };
};
