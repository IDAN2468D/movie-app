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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Star, Clock } from 'lucide-react-native';
import MarkerHighlight from './MarkerHighlight';
import { Colors } from '@/constants/Theme';
import type { TMDBMovie } from '@/lib/tmdb';
import { getImageSource, handleImageError } from '@/utils/ImageUtils';

interface HeroSliderProps {
  movies: TMDBMovie[];
}

const HeroItem = ({ item }: { item: TMDBMovie }) => {
  const [imgSource, setImgSource] = useState(getImageSource(item.backdrop_path, 'backdrop', 'large'));

  useEffect(() => {
    setImgSource(getImageSource(item.backdrop_path, 'backdrop', 'large'));
  }, [item.backdrop_path]);

  return (
    <Pressable
      className="w-screen h-[380px]"
      onPress={() => router.push(`/movie/${item.id}`)}
    >
      <Image
        source={imgSource}
        onError={handleImageError(setImgSource, 'backdrop')}
        className="w-full h-full absolute"
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(9,9,11,0.6)', Colors.background]}
        locations={[0, 0.6, 1]}
        className="absolute bottom-0 start-0 end-0 h-[70%]"
      />
      <View className="absolute bottom-10 start-5 end-5 items-start">
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
      </View>
    </Pressable>
  );
};

export default function HeroSlider({ movies }: HeroSliderProps) {
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

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View className="h-[380px] mb-2">
      <FlatList
        ref={flatListRef}
        data={heroMovies}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <HeroItem item={item} />}
        keyExtractor={(item) => item.id.toString()}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
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
