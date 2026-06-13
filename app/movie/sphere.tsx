import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
  I18nManager,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, ChevronLeft, Star, Calendar, Sparkles } from 'lucide-react-native';
import { Colors, POSTER_SIZES } from '@/constants/Theme';
import { usePopular } from '@/hooks/useMovieQueries';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Gyroscope } from '@/utils/SafeModules';
import SphereNode from '@/components/SphereNode';
import {
  useSphereActiveMovieId,
  useSphereActions,
} from '@/store/useSphereStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Generate background star particles
const STARS = Array.from({ length: 40 }).map((_, i) => ({
  id: i,
  x: Math.random() * SCREEN_WIDTH,
  y: Math.random() * (SCREEN_HEIGHT - 200),
  size: Math.random() * 2.5 + 0.5,
  opacity: Math.random() * 0.7 + 0.3,
}));

export default function SphereScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Zustand State for active selected movie
  const activeMovieId = useSphereActiveMovieId();
  const { setActiveMovieId, resetState } = useSphereActions();

  // Load popular movies for discovery
  const { data: popularMovies, isLoading, error } = usePopular();
  const movies = useMemo(() => popularMovies?.slice(0, 16) || [], [popularMovies]);

  const activeMovie = useMemo(() => {
    return movies.find((m) => m.id === activeMovieId) || null;
  }, [movies, activeMovieId]);

  // Reanimated shared values for user drag rotation
  const rotationX = useSharedValue(0);
  const rotationY = useSharedValue(0);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Gyroscope tilt values for immersive depth parallax
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  // Gyroscope registration (with soft fallback if sensor is unavailable)
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let isMounted = true;

    const startGyro = async () => {
      try {
        const isAvailable = await Gyroscope.isAvailableAsync();
        if (!isAvailable || !isMounted) {
          // Soft floating idle background animation
          tiltX.value = withRepeat(withTiming(15, { duration: 4500 }), -1, true);
          tiltY.value = withRepeat(withTiming(10, { duration: 6000 }), -1, true);
          return;
        }

        Gyroscope.setUpdateInterval(24);
        subscription = Gyroscope.addListener((data: { x: number; y: number }) => {
          if (isMounted) {
            tiltX.value = withSpring(data.y * 18, { damping: 20, stiffness: 80 });
            tiltY.value = withSpring(data.x * 18, { damping: 20, stiffness: 80 });
          }
        });
      } catch {
        if (isMounted) {
          tiltX.value = withRepeat(withTiming(15, { duration: 4500 }), -1, true);
          tiltY.value = withRepeat(withTiming(10, { duration: 6000 }), -1, true);
        }
      }
    };

    startGyro();

    return () => {
      isMounted = false;
      if (subscription) subscription.remove();
    };
  }, [tiltX, tiltY]);

  // Drag Pan Gesture Handler to rotate the 3D space
  const dragGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = rotationX.value;
      startY.value = rotationY.value;
    })
    .onUpdate((event) => {
      // Limit vertical pitch to +/- 80 degrees to avoid upsidedown flipping
      const newX = startX.value + event.translationY / 180;
      rotationX.value = Math.max(-1.4, Math.min(1.4, newX));
      // Yaw rotation (horizontal rotation) wraps indefinitely
      rotationY.value = startY.value - event.translationX / 180;
    });

  // Animated style for background glowing neon orbs
  const backgroundGlowStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tiltX.value * 1.5 },
        { translateY: tiltY.value * 1.5 },
      ],
    };
  });

  const starsParallaxStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tiltX.value * 0.4 },
        { translateY: tiltY.value * 0.4 },
      ],
    };
  });

  const handleNodePress = (movieId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveMovieId(activeMovieId === movieId ? null : movieId);
  };

  const handleDetailsPress = () => {
    if (!activeMovieId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/movie/${activeMovieId}` as any);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>מאתחל גלקסיית סרטים...</Text>
      </View>
    );
  }

  if (error || movies.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>שגיאה בטעינת גלקסיית הסרטים</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0F051D', '#09090B', '#080111']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating neon glow blobs */}
      <Animated.View style={[StyleSheet.absoluteFill, backgroundGlowStyle]}>
        <View style={styles.glowBlob1} />
        <View style={styles.glowBlob2} />
      </Animated.View>

      {/* Parallax Star Particles */}
      <Animated.View style={[StyleSheet.absoluteFill, starsParallaxStyle]} pointerEvents="none">
        {STARS.map((star) => (
          <View
            key={star.id}
            style={[
              styles.star,
              {
                left: star.x,
                top: star.y,
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                opacity: star.opacity,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Premium Glass Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            {I18nManager.isRTL ? (
              <ChevronRight color="white" size={22} />
            ) : (
              <ChevronLeft color="white" size={22} />
            )}
          </Pressable>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>ספירת הקולנוע</Text>
            <Text style={styles.headerSubtitle}>גרור כדי לסובב את גלקסיית הסרטים</Text>
          </View>

          <View style={styles.headerIconContainer}>
            <Sparkles size={18} color={Colors.primary} />
          </View>
        </View>
      </View>

      {/* Central interactive 3D Sphere viewport */}
      <GestureDetector gesture={dragGesture}>
        <View style={styles.sphereContainer}>
          {movies.map((movie, index) => (
            <SphereNode
              key={movie.id}
              movie={movie}
              index={index}
              totalNodes={movies.length}
              rotationX={rotationX}
              rotationY={rotationY}
              isActive={activeMovieId === movie.id}
              onPress={() => handleNodePress(movie.id)}
            />
          ))}
        </View>
      </GestureDetector>

      {/* Bottom sliding glass details card */}
      {activeMovie && (
        <Animated.View
          style={styles.detailsCardContainer}
        >
          <BlurView intensity={70} tint="dark" style={styles.detailsCardBlur}>
            <View style={styles.detailsCardContent}>
              <Image
                source={
                  activeMovie.poster_path
                    ? { uri: `${POSTER_SIZES.small}${activeMovie.poster_path}` }
                    : require('../../assets/images/poster-placeholder.png')
                }
                style={styles.cardPoster}
                resizeMode="cover"
              />

              <View style={styles.cardInfoContainer}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {activeMovie.title}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.ratingBadge}>
                    <Star size={12} color={Colors.secondary} fill={Colors.secondary} />
                    <Text style={styles.ratingText}>
                      {activeMovie.vote_average.toFixed(1)}
                    </Text>
                  </View>

                  {activeMovie.release_date && (
                    <View style={styles.releaseBadge}>
                      <Calendar size={12} color={Colors.textSecondary} />
                      <Text style={styles.releaseText}>
                        {activeMovie.release_date.split('-')[0]}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.cardOverview} numberOfLines={2}>
                  {activeMovie.overview || 'אין תיאור זמין עבור סרט זה.'}
                </Text>

                <Pressable
                  onPress={handleDetailsPress}
                  style={({ pressed }) => [
                    styles.detailsButton,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <LinearGradient
                    colors={[Colors.primary, '#8B152A']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text style={styles.detailsButtonText}>הצג פרטים</Text>
                </Pressable>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

const styles: any = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: 'white',
    fontSize: 15,
    marginTop: 16,
    fontFamily: 'Rubik-Medium',
  },
  errorText: {
    color: Colors.primary,
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
  },
  glowBlob1: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.25,
    left: SCREEN_WIDTH * 0.1,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Colors.primary,
    opacity: 0.08,
    filter: 'blur(70px)',
  },
  glowBlob2: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.2,
    right: SCREEN_WIDTH * 0.1,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#3B0066',
    opacity: 0.1,
    filter: 'blur(90px)',
  },
  star: {
    position: 'absolute',
    backgroundColor: 'white',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    height: 60,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'Rubik-Bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'Rubik-Regular',
    textAlign: 'center',
  },
  headerIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 20, 100, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 20, 100, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sphereContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCardContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    zIndex: 90,
  },
  detailsCardBlur: {
    padding: 16,
  },
  detailsCardContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
  },
  cardPoster: {
    width: 80,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardInfoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'Rubik-Bold',
    marginBottom: 6,
    textAlign: 'left',
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 255, 0, 0.15)',
    borderColor: 'rgba(229, 255, 0, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    color: Colors.secondary,
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    marginLeft: 4,
  },
  releaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  releaseText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: 'Rubik-Regular',
    marginLeft: 4,
  },
  cardOverview: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'left',
  },
  detailsButton: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  detailsButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
  },
});
