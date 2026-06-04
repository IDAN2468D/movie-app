/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Dimensions,
  Image,
  Pressable,
  FlatList,
  ViewToken,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Star, Clock } from 'lucide-react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation, type SharedValue } from 'react-native-reanimated';
import MarkerHighlight from './MarkerHighlight';
import { Colors } from '@/constants/Theme';
import type { TMDBMovie } from '@/lib/tmdb';
import { getImageSource, handleImageError } from '@/utils/ImageUtils';

interface HeroSliderProps {
  movies: TMDBMovie[];
  scrollY?: SharedValue<number>;
  onActiveMovieChange?: (movie: TMDBMovie) => void;
}

const VIEWABILITY_CONFIG = { viewAreaCoveragePercentThreshold: 50 };

const HeroItem = ({ item, scrollY }: { item: TMDBMovie; scrollY?: SharedValue<number> }) => {
  const [imgSource, setImgSource] = useState(getImageSource(item.backdrop_path, 'backdrop', 'large'));

  useEffect(() => {
    setImgSource(getImageSource(item.backdrop_path, 'backdrop', 'large'));
  }, [item.backdrop_path]);

  // High performance Reanimated 3D Parallax visual styles
  const imageAnimatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    
    // Backdrop moves slower than scrollY (0.5x speed)
    const translateY = interpolate(
      scrollY.value,
      [-150, 0, 380],
      [-75, 0, 190],
      Extrapolation.CLAMP
    );
    // Expand/Scale slightly on pull down
    const scale = interpolate(
      scrollY.value,
      [-150, 0, 380],
      [1.25, 1, 1.05],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateY },
        { scale }
      ]
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    
    // Text elements scroll at a different offset/velocity (0.85x speed/translate offset)
    const translateY = interpolate(
      scrollY.value,
      [-150, 0, 380],
      [20, 0, -60],
      Extrapolation.CLAMP
    );
    // Smoothly fade out the text layer on vertical scroll
    const opacity = interpolate(
      scrollY.value,
      [0, 280],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [
        { translateY }
      ]
    };
  });

  return (
    <Pressable
      className="w-screen h-[380px]"
      onPress={() => router.push(`/movie/${item.id}`)}
    >
      <Animated.View style={[StyleSheet.absoluteFill, imageAnimatedStyle]}>
        <Image
          source={imgSource}
          onError={handleImageError(setImgSource, 'backdrop')}
          className="w-full h-full"
          resizeMode="cover"
        />
      </Animated.View>
      <LinearGradient
        colors={['transparent', 'rgba(9,9,11,0.6)', Colors.background]}
        locations={[0, 0.6, 1]}
        className="absolute bottom-0 start-0 end-0 h-[70%]"
      />
      <Animated.View style={textAnimatedStyle} className="absolute bottom-10 start-5 end-5 items-start">
        <MarkerHighlight 
          text={item.title.length > 25 ? `${item.title.substring(0, 25)}...` : item.title} 
          className="text-h2 text-white self-stretch text-right"
          color={Colors.primary} 
          delay={500}
          numberOfLines={1}
        />
        <View className="flex-row-reverse gap-4 mt-2 justify-end">
          <View className="flex-row items-center gap-1">
            <Star size={14} color={Colors.primary} fill={Colors.primary} />
            <Text style={{ fontFamily: 'Rubik-Medium' }} className="text-caption text-textSecondary">{item.vote_average.toFixed(1)}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Clock size={14} color={Colors.textSecondary} />
            <Text style={{ fontFamily: 'Rubik-Regular' }} className="text-caption text-textSecondary">{item.release_date?.split('-')[0]}</Text>
          </View>
        </View>
        <Text style={{ fontFamily: 'Rubik-Regular', textAlign: 'right' }} className="text-body text-textSecondary mb-5 opacity-80" numberOfLines={1}>
          {item.overview}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

export default function HeroSlider({ movies, scrollY, onActiveMovieChange }: HeroSliderProps) {
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const heroMovies = movies.slice(0, 5);

  // Auto-scroll
  useEffect(() => {
    if (heroMovies.length <= 1) return;
    const timer = setInterval(() => {
      const next = (activeIndex + 1) % heroMovies.length;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    }, 5000);
    return () => clearInterval(timer);
  }, [activeIndex, heroMovies.length]);

  // Notify parent of active movie initial load and updates
  useEffect(() => {
    if (heroMovies.length > 0) {
      onActiveMovieChange?.(heroMovies[activeIndex]);
    }
  }, [heroMovies, activeIndex, onActiveMovieChange]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        const index = viewableItems[0].index;
        setActiveIndex(index);
        onActiveMovieChange?.(heroMovies[index]);
      }
    },
    [heroMovies, onActiveMovieChange]
  );

  return (
    <View className="h-[380px] mb-2">
      <FlatList
        ref={flatListRef}
        data={heroMovies}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <HeroItem item={item} scrollY={scrollY} />}
        keyExtractor={(item) => item.id.toString()}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
      />
      {/* Dot indicators */}
      <View className="flex-row-reverse justify-center gap-1.5 absolute bottom-3 start-0 end-0">
        {heroMovies.map((_, i) => (
          <View
            key={i}
            className={`h-1 rounded-full ${
              i === activeIndex 
                ? "bg-primary w-6" 
                : "bg-white/30 w-1.5"
            }`}
          />
        ))}
      </View>
    </View>
  );
}
