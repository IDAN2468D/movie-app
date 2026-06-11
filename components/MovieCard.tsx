import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Bookmark } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { ZoomIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import type { TMDBMovie } from '@/lib/tmdb';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getImageSource, handleImageError } from '@/utils/ImageUtils';

export const CARD_WIDTH = Dimensions.get('window').width * 0.38;
export const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface MovieCardProps {
  movie: TMDBMovie;
  index?: number;
}

const MovieCard = React.memo(function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const isBookmarked = useWatchlistStore(state => state.movies.some(m => m.id === movie.id));
  const addToWatchlist = useWatchlistStore(state => state.addToWatchlist);
  const removeFromWatchlist = useWatchlistStore(state => state.removeFromWatchlist);
  
  const toggleFavorite = useAuthStore(state => state.toggleFavorite);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  const [imgSource, setImgSource] = useState(getImageSource(movie.poster_path, 'poster', 'medium'));

  const scaleValue = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
    };
  });

  const handlePressIn = () => {
    scaleValue.value = withSpring(0.93, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  // Update image source when movie changes
  useEffect(() => {
    setImgSource(getImageSource(movie.poster_path, 'poster', 'medium'));
  }, [movie.poster_path]);

  const handlePress = () => {
    router.push(`/movie/${movie.id}`);
  };

  const toggleWatchlist = (e: any) => {
    e.stopPropagation();
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

  return (
    <Animated.View
      entering={ZoomIn.delay(Math.min(index * 60, 480)).springify().damping(15)}
    >
      <Animated.View style={scaleStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          className="me-3.5"
          style={{ width: CARD_WIDTH }}
        >
          <View className="rounded-2xl overflow-hidden bg-surfaceLight/10 border border-white/10" style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
            <Image
              source={imgSource}
              onError={handleImageError(setImgSource, 'poster')}
              className="w-full h-full"
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              className="absolute bottom-0 start-0 end-0 h-[50%]"
            />
            
            <View className="absolute top-2 start-2 flex-row items-center bg-black/40 px-2 py-1 rounded-lg border border-white/10">
              <Star size={10} color={Colors.secondary} fill={Colors.secondary} />
              <Text className="text-[11px] font-bold text-secondary ms-1" style={{ fontFamily: 'Rubik-Bold' }}>
                {movie.vote_average.toFixed(1)}
              </Text>
            </View>
            
            <View className="absolute bottom-2 start-2 bg-black/40 px-2 py-1 rounded-lg border border-white/10">
              <Text className="text-[10px] text-white/80" style={{ fontFamily: 'Rubik-Regular' }}>
                {movie.release_date?.split('-')[0]}
              </Text>
            </View>

            <Pressable 
              onPress={toggleWatchlist}
              className="absolute top-2 end-2 bg-black/40 p-2 rounded-full border border-white/10"
              style={({ pressed }) => [pressed && { scale: 0.9, opacity: 0.8 }]}
            >
              <Bookmark 
                size={14} 
                color={isBookmarked ? Colors.primary : "white"} 
                fill={isBookmarked ? Colors.primary : "transparent"} 
              />
            </Pressable>
          </View>
          <Text style={{ fontFamily: 'Rubik-Bold' }} className="text-[14px] text-white mt-2.5 text-left px-1" numberOfLines={1}>
            {movie.title.length > 14 ? `${movie.title.substring(0, 14)}...` : movie.title}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

export default MovieCard;

// NativeWind migration complete - styles object removed
