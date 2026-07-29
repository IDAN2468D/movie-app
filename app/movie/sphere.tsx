import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
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
import SphereControls from '@/components/sphere/SphereControls';
import SphereMovieModal from '@/components/sphere/SphereMovieModal';
import {
  useSphereActiveMovieId,
  useSphereActions,
} from '@/store/useSphereStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  const activeMovieId = useSphereActiveMovieId();
  const { setActiveMovieId, resetState } = useSphereActions();

  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);

  const { data: popularMovies, isLoading, error } = usePopular();

  const filteredMovies = useMemo(() => {
    const rawList = popularMovies?.slice(0, 20) || [];
    if (!selectedGenreId) return rawList;
    return rawList.filter((m) => m.genre_ids?.includes(selectedGenreId));
  }, [popularMovies, selectedGenreId]);

  const activeMovie = useMemo(() => {
    return filteredMovies.find((m) => m.id === activeMovieId) || null;
  }, [filteredMovies, activeMovieId]);

  const rotationX = useSharedValue(0);
  const rotationY = useSharedValue(0);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  // Auto spin loop
  useEffect(() => {
    if (!isAutoSpinning) return;
    const interval = setInterval(() => {
      rotationY.value = rotationY.value + 0.012;
    }, 16);
    return () => clearInterval(interval);
  }, [isAutoSpinning]);

  // Gyroscope registration
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let isMounted = true;

    const startGyro = async () => {
      try {
        const isAvailable = await Gyroscope.isAvailableAsync();
        if (!isAvailable || !isMounted) {
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

  const dragGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = rotationX.value;
      startY.value = rotationY.value;
    })
    .onUpdate((event) => {
      const newX = startX.value + event.translationY / 180;
      rotationX.value = Math.max(-1.4, Math.min(1.4, newX));
      rotationY.value = startY.value - event.translationX / 180;
    });

  const backgroundGlowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltX.value * 1.5 },
      { translateY: tiltY.value * 1.5 },
    ],
  }));

  const starsParallaxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltX.value * 0.4 },
      { translateY: tiltY.value * 0.4 },
    ],
  }));

  const handleNodePress = (movieId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveMovieId(activeMovieId === movieId ? null : movieId);
  };

  const handleNavigateToDetails = (movieId: number) => {
    router.push(`/movie/${movieId}` as any);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>מאתחל גלקסיית סרטים...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <LinearGradient
        colors={['#0F051D', '#09090B', '#080111']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={[StyleSheet.absoluteFill, backgroundGlowStyle]}>
        <View style={styles.glowBlob1} />
        <View style={styles.glowBlob2} />
      </Animated.View>

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

      {/* Glass Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            {I18nManager.isRTL ? <ChevronRight color="white" size={22} /> : <ChevronLeft color="white" size={22} />}
          </Pressable>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>ספירת הקולנוע</Text>
            <Text style={styles.headerSubtitle}>גרור כדי לסובב את גלקסיית הסרטים</Text>
          </View>

          <View style={styles.headerIconContainer}>
            <Sparkles size={18} color={Colors.primary} />
          </View>
        </View>

        {/* Auto Spin & Filter Controls */}
        <SphereControls
          isAutoSpinning={isAutoSpinning}
          onToggleAutoSpin={() => setIsAutoSpinning(!isAutoSpinning)}
          selectedGenreId={selectedGenreId}
          onSelectGenre={setSelectedGenreId}
        />
      </View>

      {/* 3D Sphere Viewport */}
      <GestureDetector gesture={dragGesture}>
        <View style={styles.sphereContainer}>
          {filteredMovies.map((movie, index) => (
            <SphereNode
              key={movie.id}
              movie={movie}
              index={index}
              totalNodes={filteredMovies.length}
              rotationX={rotationX}
              rotationY={rotationY}
              isActive={activeMovieId === movie.id}
              onPress={() => handleNodePress(movie.id)}
            />
          ))}
        </View>
      </GestureDetector>

      {/* Active Movie Preview Modal */}
      {activeMovie && (
        <SphereMovieModal
          movie={activeMovie}
          onClose={() => setActiveMovieId(null)}
          onNavigateToDetails={handleNavigateToDetails}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
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
  glowBlob1: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.25,
    left: SCREEN_WIDTH * 0.1,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Colors.primary,
    opacity: 0.08,
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
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
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
    color: 'rgba(255, 255, 255, 0.6)',
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
});
