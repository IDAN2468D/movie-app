import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions, Pressable, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useDerivedValue,
  SharedValue,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { X, Sparkles, Play } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { useNowPlaying } from '@/hooks/useMovieQueries';
import { getImageSource } from '@/utils/ImageUtils';
import type { TMDBMovie } from '@/lib/tmdb';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_HEIGHT = CARD_WIDTH * 1.5;
const SPACER = (SCREEN_WIDTH - CARD_WIDTH) / 2;

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

  // Haptic feedback on index change
  useAnimatedReaction(
    () => activeIndex.value,
    (current, previous) => {
      if (previous !== null && current !== previous) {
        runOnJS(Haptics.selectionAsync)();
      }
    }
  );

  const movieData = useMemo(() => {
    if (movies.length > 0) return movies.slice(0, 10);
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
              blurRadius={25}
            />
          );
        })}
        {/* Deep blur for Liquid Glass 2.0 contrast */}
        <BlurView intensity={85} style={StyleSheet.absoluteFill} tint="dark" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.circleButton} onPress={() => router.back()}>
          <X size={20} color="#FFF" />
        </Pressable>
        <View style={styles.titleBadge}>
          <Sparkles size={16} color={Colors.primary} />
          <Text style={styles.titleText}>גילוי מעגלי • CineArc</Text>
        </View>
        <View style={{ width: 44 }} />
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

      {/* 4. 3D Arc Card Scroll */}
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
            activeIndex={activeIndex}
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
  activeIndex: SharedValue<number>;
}

function MovieArcCard({ movie, index, scrollX, activeIndex }: MovieArcCardProps) {
  const cardAnimatedStyle = useAnimatedStyle(() => {
    const cardProgress = index - (scrollX.value / CARD_WIDTH);
    
    // 3D Perspective and Rotation (Tilt inward based on position)
    const rotateY = interpolate(cardProgress, [-1, 0, 1], [35, 0, -35], Extrapolation.CLAMP);
    const scale = interpolate(Math.abs(cardProgress), [0, 1], [1, 0.8], Extrapolation.CLAMP);
    const opacity = interpolate(Math.abs(cardProgress), [0, 1, 1.5], [1, 0.5, 0], Extrapolation.CLAMP);
    const translateY = interpolate(Math.abs(cardProgress), [0, 1], [0, 40], Extrapolation.CLAMP);

    return {
      transform: [
        { perspective: 1000 },
        { translateY },
        { rotateY: `${rotateY}deg` },
        { scale },
      ],
      opacity,
    };
  });

  const imageParallaxStyle = useAnimatedStyle(() => {
    const cardProgress = index - (scrollX.value / CARD_WIDTH);
    const translateX = cardProgress * 60; // Parallax distance
    return {
      transform: [{ translateX }],
    };
  });

  const infoAnimatedStyle = useAnimatedStyle(() => {
    const cardProgress = index - (scrollX.value / CARD_WIDTH);
    const opacity = interpolate(Math.abs(cardProgress), [0, 0.2, 1], [1, 0, 0], Extrapolation.CLAMP);
    const translateY = interpolate(Math.abs(cardProgress), [0, 0.5], [0, 20], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ translateY }]
    };
  });

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({ pathname: '/movie/[id]', params: { id: movie.id } } as any);
  };

  return (
    <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
      <Pressable style={styles.cardInner} onPress={handleCardPress}>
        
        <View style={styles.imageWrapper}>
          <Animated.Image
            source={getImageSource(movie.poster_path, 'poster', 'large')}
            style={[styles.cardImage, imageParallaxStyle]}
            resizeMode="cover"
          />
          {/* Inner Vignette / Dark gradient at bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.4 }}
            end={{ x: 0, y: 1 }}
          />
        </View>

        {/* Liquid Glass Border & Shine */}
        <LinearGradient
          colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.05)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          className="rounded-[32px] border border-white/20"
        />

        {/* Liquid Glass Dynamic Info */}
        <Animated.View style={[styles.textContainer, infoAnimatedStyle]}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} className="rounded-b-[32px]" />
          <View style={styles.textInner}>
            <View style={styles.playBadge}>
              <Play size={12} color="#000" fill="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{movie.title}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {movie.overview || 'סרט קולנוע מרהיב, זמין כעת בהזמנה מהירה ובאיכות מרבית.'}
              </Text>
            </View>
          </View>
        </Animated.View>
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
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 15,
  },
  imageWrapper: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
  },
  cardImage: {
    width: '130%',
    height: '100%',
    alignSelf: 'center',
  },
  textContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  textInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  playBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'Assistant-Bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  cardDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: 'Assistant-Regular',
    textAlign: 'right',
    lineHeight: 18,
  },
});
