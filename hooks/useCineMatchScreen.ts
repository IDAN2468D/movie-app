import { useState, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import { PanResponder } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { usePopular } from '@/hooks/useMovieQueries';
import { useCineMatchStore } from '@/store/useCineMatchStore';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { type TMDBMovie } from '@/lib/tmdb';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;

export const useCineMatchScreen = () => {
  const { data: popularMovies = [], isLoading } = usePopular();
  const { likedMovieIds, skippedMovieIds, isGroupMode, roomId, setGroupMode, createRoom, joinRoom, leaveRoom, swipeMovie, resetCineMatch } = useCineMatchStore();
  const { addToWatchlist } = useWatchlistStore();

  const [roomInput, setRoomInput] = useState('');
  const [errorText, setErrorText] = useState('');
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatchMovie, setLastMatchMovie] = useState<TMDBMovie | null>(null);
  const participants = 2;
  const inRoom = !!roomId;

  const remainingMovies = popularMovies.filter(
    (movie) => !likedMovieIds.includes(movie.id) && !skippedMovieIds.includes(movie.id)
  );

  const position = useRef(new Animated.ValueXY()).current;
  const nextCardOpacity = useRef(new Animated.Value(0.9)).current;
  const nextCardScale = useRef(new Animated.Value(0.95)).current;

  const swipeRight = () => {
    const currentMovie = remainingMovies[0];
    if (!currentMovie) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(position, { toValue: { x: SCREEN_WIDTH + 100, y: 0 }, duration: 250, useNativeDriver: false }).start(() => {
      addToWatchlist(currentMovie);
      const { isMatch } = swipeMovie(currentMovie, true);
      if (isMatch) { setLastMatchMovie(currentMovie); setShowMatchModal(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
      position.setValue({ x: 0, y: 0 }); nextCardOpacity.setValue(0.9); nextCardScale.setValue(0.95);
    });
  };

  const swipeLeft = () => {
    const currentMovie = remainingMovies[0];
    if (!currentMovie) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(position, { toValue: { x: -SCREEN_WIDTH - 100, y: 0 }, duration: 250, useNativeDriver: false }).start(() => {
      swipeMovie(currentMovie, false);
      position.setValue({ x: 0, y: 0 }); nextCardOpacity.setValue(0.9); nextCardScale.setValue(0.95);
    });
  };

  const resetPosition = () => {
    Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 4, useNativeDriver: false }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        position.setValue({ x: gs.dx, y: gs.dy });
        const progress = Math.min(Math.abs(gs.dx) / SWIPE_THRESHOLD, 1);
        nextCardOpacity.setValue(0.9 + progress * 0.1);
        nextCardScale.setValue(0.95 + progress * 0.05);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) swipeRight();
        else if (gs.dx < -SWIPE_THRESHOLD) swipeLeft();
        else resetPosition();
      },
    })
  ).current;

  const getCardStyle = () => {
    const rotate = position.x.interpolate({ inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2], outputRange: ['-10deg', '0deg', '10deg'], extrapolate: 'clamp' });
    return { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] };
  };

  const likeOpacity = position.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const dislikeOpacity = position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const handleCreateRoom = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); createRoom(); };
  const handleJoinRoom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (roomInput.trim().length === 0) { setErrorText('נא להזין קוד חדר תקין'); return; }
    const success = joinRoom(roomInput.trim());
    if (!success) { setErrorText('חדר לא נמצא, נסה שוב'); } else { setErrorText(''); setRoomInput(''); }
  };
  const handleResetSession = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); resetCineMatch(); };
  const handleLeaveRoom = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); leaveRoom(); };
  const handleCloseMatchModal = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowMatchModal(false); };
  const handleBookMatch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowMatchModal(false);
    if (lastMatchMovie) router.push({ pathname: '/movie-detail' as any, params: { id: lastMatchMovie.id } });
  };
  const goBack = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); };

  return {
    isLoading, remainingMovies, isGroupMode, inRoom, roomId, participants, lastMatchMovie,
    roomInput, setRoomInput, errorText, showMatchModal,
    panResponder, nextCardOpacity, nextCardScale, getCardStyle, likeOpacity, dislikeOpacity,
    swipeRight, swipeLeft, setGroupMode, handleCreateRoom, handleJoinRoom, handleResetSession,
    handleLeaveRoom, handleCloseMatchModal, handleBookMatch, goBack,
  };
};
