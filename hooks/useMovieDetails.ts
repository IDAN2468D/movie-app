import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { useBookingStore, type Showtime } from '@/store/useBookingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { AIService } from '@/services/AIService';
import {
  getMovieDetails,
  getMovieCredits,
  getMovieVideos,
  type TMDBMovieDetails,
  type TMDBCast,
  type TMDBVideo,
} from '@/lib/tmdb';

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

export const useMovieDetails = (id: string | undefined) => {
  const router = useRouter();
  
  // 1. Store State
  const selectMovie = useBookingStore(state => state.selectMovie);
  const selectDate = useBookingStore(state => state.selectDate);
  const selectShowtime = useBookingStore(state => state.selectShowtime);
  const selectedDate = useBookingStore(state => state.selectedDate);
  const selectedShowtime = useBookingStore(state => state.selectedShowtime);
  const { user, toggleFavorite } = useAuthStore();

  // 2. Local State
  const [movie, setMovie] = useState<TMDBMovieDetails | null>(null);
  const [cast, setCast] = useState<TMDBCast[]>([]);
  const [videos, setVideos] = useState<TMDBVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<{ pros: string[]; cons: string[]; verdict: string } | null>(null);

  // 3. Animation State
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // 4. Memoized Data
  const dates = useMemo(() => getNext7Days(), []);

  // 5. Fetching Logic
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
        
        const movieVideos = videoData.filter(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
        setVideos(movieVideos.length > 0 ? movieVideos : videoData.filter(v => v.site === 'YouTube'));
        console.log(`[useMovieDetails] Found ${videoData.length} videos, filtered to ${movieVideos.length} trailers/teasers`);

        selectMovie(movieId, details.title, details.poster_path || '');
        if (!selectedDate) {
          selectDate(dates[0].date);
        }

        // Fetch AI Insights
        AIService.getMovieInsights(details.title, details.overview).then(setInsights);
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

  // 6. Action Handlers
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
        console.log('Trailer button pressed, key:', videos[0].key);
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
      toggleFavorite(movie.id);
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
  };
};
