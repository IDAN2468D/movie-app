import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions, Pressable, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useDerivedValue,
  SharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { X, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { useNowPlaying } from '@/hooks/useMovieQueries';
import { getImageSource } from '@/utils/ImageUtils';
import type { TMDBMovie } from '@/lib/tmdb';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const CARD_HEIGHT = CARD_WIDTH * 1.45;
const SPACER = (SCREEN_WIDTH - CARD_WIDTH) / 2;

// Circular Arc Geometry Configuration
const RADIUS = SCREEN_WIDTH * 1.15; 
const ARC_ANGLE = 0.3 * Math.PI; // angle span in radians
const START_ANGLE = Math.PI * 1.5; // peak of the circle at top-center

export default function CineArcScreen() {
  const insets = useSafeAreaInsets();
  const { data: movies = [], isLoading } = useNowPlaying();
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const activeIndex = useDerivedValue(() => {
    return Math.round(scrollX.value / CARD_WIDTH);
  });

  // Use a fallback list of movies if TMDB returns empty or is still loading
  const movieData = useMemo(() => {
    if (movies.length > 0) return movies.slice(0, 10);
    // Offline local simulation movies
    return [
      { id: 1, title: 'התחלה (Inception)', overview: 'ההשתלה של רעיון במוחו של אדם היא הפשע המושלם.', poster_path: '/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg', backdrop_path: '/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg' },
      { id: 2, title: 'בין כוכבים (Interstellar)', overview: 'המסע של האנושות אל מעבר לגלקסיה שלנו כדי למצוא בית חדש.', poster_path: '/gEU2Qv4w36vYv2PwICz2ftZs2qg.jpg', backdrop_path: '/gEU2Qv4w36vYv2PwICz2ftZs2qg.jpg' },
      { id: 3, title: 'האביר האפל (The Dark Knight)', overview: 'מלחמתו של באטמן נגד כוחות הכאוס של הג׳וקר בגות׳האם.', poster_path: '/qJ2tWGBUrbbmR0RYP2J4XPrmCkp.jpg', backdrop_path: '/qJ2tWGBUrbbmR0RYP2J4XPrmCkp.jpg' },
      { id: 4, title: 'אווטאר: דרך המים', overview: 'חזרה לפנדורה למאבק קיומי חדש של משפחת סאלי.', poster_path: '/t6HI03XYLjU7t5RCNnIUJXlhSuV.jpg', backdrop_path: '/t6HI03XYLjU7t5RCNnIUJXlhSuV.jpg' }
    ] as any[] as TMDBMovie[];
  }, [movies]);

  if (isLoading && movies.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>טוען קטלוג מעגלי...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* 1. Dynamic Parallax Background Layer */}
      <View style={StyleSheet.absoluteFill}>
        {movieData.map((movie, index) => {
          const bgAnimatedStyle = useAnimatedStyle(() => {
            const opacity = interpolate(
              scrollX.value,
              [(index - 1) * CARD_WIDTH, index * CARD_WIDTH, (index + 1) * CARD_WIDTH],
              [0, 1, 0],
              Extrapolation.CLAMP
            );
            return { opacity };
          });

          return (
            <Animated.Image
              key={`bg-${movie.id}`}
              source={getImageSource(movie.backdrop_path || movie.poster_path, 'backdrop', 'large')}
              style={[StyleSheet.absoluteFill, styles.bgImage, bgAnimatedStyle]}
              blurRadius={18}
            />
          );
        })}
        <BlurView intensity={75} style={StyleSheet.absoluteFill} tint="dark" />
      </View>

      {/* 2. Top Header Navigation */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.circleButton} onPress={() => router.back()}>
          <X size={20} color="#FFF" />
        </Pressable>

        <View style={styles.titleBadge}>
          <Sparkles size={16} color={Colors.primary} />
          <Text style={styles.titleText}>גילוי מעגלי • CineArc</Text>
        </View>

        <View style={{ width: 44 }} /> {/* balance layout spacing */}
      </View>

      {/* 3. Cinema Digital Index Counter */}
      <View style={[styles.counterContainer, { top: insets.top + 70 }]}>
        <Text style={styles.counterLabel}>אינדקס סרט</Text>
        <View style={styles.digitWrapper}>
          {movieData.map((_, index) => {
            const digitAnimatedStyle = useAnimatedStyle(() => {
              const translateY = interpolate(
                activeIndex.value,
                [index - 1, index, index + 1],
                [34, 0, -34],
                Extrapolation.CLAMP
              );
              const opacity = interpolate(
                activeIndex.value,
                [index - 1, index, index + 1],
                [0, 1, 0],
                Extrapolation.CLAMP
              );

              return {
                transform: [{ translateY }],
                opacity,
                position: 'absolute',
              };
            });

            return (
              <Animated.Text key={`digit-${index}`} style={[styles.counterDigit, digitAnimatedStyle]}>
                {String(index + 1).padStart(2, '0')}
              </Animated.Text>
            );
          })}
        </View>
      </View>

      {/* 4. Circular Arc Card Scroll */}
      <Animated.ScrollView
        horizontal
        style={StyleSheet.absoluteFill}
        contentContainerStyle={[styles.scrollContainer, { paddingTop: insets.top + 90, paddingBottom: insets.bottom + 40 }]}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {movieData.map((movie, index) => (
          <MovieArcCard
            key={movie.id}
            movie={movie}
            index={index}
            scrollX={scrollX}
          />
        ))}
      </Animated.ScrollView>

    </View>
  );
}

// === Circular Movie Card Subcomponent ===
interface MovieArcCardProps {
  movie: TMDBMovie;
  index: number;
  scrollX: SharedValue<number>;
}

function MovieArcCard({ movie, index, scrollX }: MovieArcCardProps) {
  const cardAnimatedStyle = useAnimatedStyle(() => {
    const cardProgress = index - (scrollX.value / CARD_WIDTH);
    
    // Trigonometric positioning on circular arc
    const angle = START_ANGLE + (cardProgress * (ARC_ANGLE / 2));
    const translateX = RADIUS * Math.cos(angle);
    const translateY = RADIUS * Math.sin(angle) + RADIUS - 40;
    const rotation = (angle - START_ANGLE) * (180 / Math.PI);

    // Scale and opacity adjustments based on distance from center
    const distanceFromCenter = Math.abs(cardProgress);
    const scale = interpolate(distanceFromCenter, [0, 1], [1, 0.86], Extrapolation.CLAMP);
    const opacity = interpolate(distanceFromCenter, [0, 1.8], [1, 0.25], Extrapolation.CLAMP);

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate: `${rotation}deg` },
        { scale },
      ],
      opacity,
    };
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * CARD_WIDTH, index * CARD_WIDTH, (index + 1) * CARD_WIDTH];
    const translateX = interpolate(scrollX.value, inputRange, [-32, 0, 32], Extrapolation.CLAMP);
    return {
      transform: [{ translateX }],
    };
  });

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/movie/[id]', params: { id: movie.id } } as any);
  };

  return (
    <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
      <Pressable style={styles.cardInner} onPress={handleCardPress}>
        <View style={styles.imageWrapper}>
          <Animated.Image
            source={getImageSource(movie.poster_path, 'poster', 'medium')}
            style={[styles.cardImage, imageAnimatedStyle]}
            resizeMode="cover"
          />
        </View>

        {/* Liquid Glass Bottom Description Overlay */}
        <BlurView intensity={35} tint="dark" style={styles.textContainer}>
          <Text style={styles.cardTitle} numberOfLines={1}>{movie.title}</Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {movie.overview || 'סרט מדהים עכשיו בבתי הקולנוע.'}
          </Text>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#050508',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: 'Assistant-Regular',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
    gap: 8,
  },
  titleText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Assistant-Bold',
  },
  counterContainer: {
    position: 'absolute',
    right: 32,
    zIndex: 90,
    alignItems: 'flex-end',
  },
  counterLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontFamily: 'Assistant-Bold',
    letterSpacing: 1.5,
  },
  digitWrapper: {
    height: 38,
    overflow: 'hidden',
    marginTop: 2,
    justifyContent: 'center',
    width: 60,
    alignItems: 'flex-end',
  },
  counterDigit: {
    color: '#FFF',
    fontSize: 34,
    fontFamily: 'Outfit-Bold',
  },
  scrollContainer: {
    paddingHorizontal: SPACER,
    alignItems: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInner: {
    width: CARD_WIDTH - 16,
    height: CARD_HEIGHT - 20,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  imageWrapper: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 27,
  },
  cardImage: {
    width: '124%',
    height: '100%',
    alignSelf: 'center',
  },
  textContainer: {
    padding: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Assistant-Bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  cardDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: 'Assistant-Regular',
    textAlign: 'right',
    lineHeight: 16,
  },
});
