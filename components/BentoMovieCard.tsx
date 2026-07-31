import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Star } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import type { TMDBMovie } from '@/lib/tmdb';
import { getImageSource, handleImageError } from '@/utils/ImageUtils';
import { getGenreName } from '@/lib/tmdb';
import { playCuteMovieClickSound } from '@/utils/SoundEffects';

export type BentoSize = 'hero' | 'large' | 'medium' | 'small';

interface BentoMovieCardProps {
  movie: TMDBMovie;
  size?: BentoSize;
  onPress?: () => void;
  index?: number;
}

const ReanimatedPressable = Reanimated.createAnimatedComponent(Pressable);

const BentoMovieCard = React.memo(function BentoMovieCard({ 
  movie, 
  size = 'small', 
  onPress,
  index = 0
}: BentoMovieCardProps) {
  const [imgSource, setImgSource] = useState(getImageSource(movie.poster_path, 'poster', size === 'hero' ? 'large' : 'medium'));
  const scale = useSharedValue(1);

  useEffect(() => {
    setImgSource(getImageSource(movie.poster_path, 'poster', size === 'hero' ? 'large' : 'medium'));
  }, [movie.poster_path, size]);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    playCuteMovieClickSound();
    if (onPress) onPress();
    else router.push(`/movie/${movie.id}`);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Calculate dimensions based on Bento Grid system (assuming a 2-column parent container)
  const getContainerStyle = () => {
    switch (size) {
      case 'hero':
        return { width: '100%', height: 220, aspectRatio: undefined };
      case 'large':
        return { width: '100%', height: 180, aspectRatio: undefined };
      case 'medium':
        return { flex: 1, height: 160, aspectRatio: undefined };
      case 'small':
        return { flex: 1, height: 120, aspectRatio: undefined };
    }
  };

  return (
    <ReanimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        animatedStyle,
        getContainerStyle(),
        {
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: Colors.surfaceLight,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        }
      ]}
    >
      {/* Dynamic Background */}
      <Image
        source={imgSource}
        onError={handleImageError(setImgSource, 'poster')}
        style={[StyleSheet.absoluteFill, { opacity: 0.8 }]}
        resizeMode="cover"
      />
      
      {/* Liquid Glass Overlay */}
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={[StyleSheet.absoluteFill, { top: '30%' }]}
      />

      {/* Content Container */}
      <View className="flex-1 justify-between p-3">
        <View className="flex-row justify-between items-start">
          <View className="flex-row items-center bg-black/50 px-2 py-1 rounded-lg border border-white/10 backdrop-blur-md">
            <Star size={10} color={Colors.secondary} fill={Colors.secondary} />
            <Text className="text-[11px] font-bold text-secondary ms-1" style={{ fontFamily: 'Rubik-Bold' }}>
              {movie.vote_average.toFixed(1)}
            </Text>
          </View>
        </View>

        <View>
          <Text 
            className="text-white font-bold text-left" 
            style={{ 
              fontFamily: 'Rubik-Bold',
              fontSize: size === 'hero' ? 22 : size === 'large' ? 18 : 14,
              lineHeight: size === 'hero' ? 28 : 22
            }} 
            numberOfLines={size === 'small' ? 1 : 2}
          >
            {movie.title}
          </Text>
          
          {size !== 'small' && (
            <Text 
              className="text-textMuted mt-1 text-left" 
              style={{ fontFamily: 'Rubik-Regular', fontSize: size === 'hero' ? 14 : 12 }}
            >
              {getGenreName(movie.genre_ids?.[0])} {movie.release_date ? `• ${movie.release_date.split('-')[0]}` : ''}
            </Text>
          )}
        </View>
      </View>
    </ReanimatedPressable>
  );
});

export default BentoMovieCard;
