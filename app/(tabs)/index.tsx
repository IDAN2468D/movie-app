/* eslint-disable react-hooks/immutability, react-hooks/exhaustive-deps */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  I18nManager,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Theme';
import HeroSlider from '@/components/HeroSlider';
import MovieCard from '@/components/MovieCard';
import SectionHeader from '@/components/SectionHeader';
import AIConciergeModal from '@/components/AIConciergeModal';
import { AIButton } from '@/components/AIButton';
import ScannerButton from '@/components/ScannerButton';
import { useHome } from '@/hooks/useHome';
import StoriesRow from '@/components/StoriesRow';
import MovieStories from '@/components/MovieStories';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import CinematicFeed from '@/components/CinematicFeed';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withTiming,
} from 'react-native-reanimated';
import { GENRE_THEMES } from '@/hooks/useMovieTheme';
import { CARD_WIDTH } from '@/components/MovieCard';

const VIEWABILITY_CONFIG_HORIZONTAL = {
  itemVisiblePercentThreshold: 50,
};


export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [isCinematicView, setIsCinematicView] = useState(false);
  const {
    nowPlaying,
    popular,
    topRated,
    loading,
    refreshing,
    aiModalVisible,
    storiesVisible,
    selectedStoryIndex,
    onRefresh,
    toggleAiModal,
    handleStoryPress,
    closeStories,
  } = useHome();

  // Scroll and Progress tracking (Top level, strictly before loading conditional)
  const scrollY = useSharedValue(0);
  const scrollProgress = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      const totalScrollable = event.contentSize.height - event.layoutMeasurement.height;
      scrollProgress.value = totalScrollable > 0 ? event.contentOffset.y / totalScrollable : 0;
    }
  });

  // Scroll Progress Bar Animated Style (Uses high-performance transform scaleX & translateX)
  const screenWidth = Dimensions.get('window').width;
  const progressBarStyle = useAnimatedStyle(() => {
    const scale = scrollProgress.value;
    const translation = I18nManager.isRTL 
      ? (1 - scale) * (screenWidth / 2) 
      : (scale - 1) * (screenWidth / 2);
    return {
      transform: [
        { scaleX: scale },
        { translateX: translation }
      ],
      width: '100%',
    };
  });

  // Sticky header animation
  const stickyHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 80],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Ambient Glow Color shared values
  const glowPrimary = useSharedValue<string>(Colors.primary);
  const glowSecondary = useSharedValue<string>('#9B1B30');

  // Multi-layered/Dynamic Ambient Glow Style (Scales and fades dynamically on scroll)
  const ambientGlowStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [0, 500], [1, 1.2], Extrapolation.CLAMP);
    const opacity = interpolate(scrollY.value, [0, 500], [0.15, 0.08], Extrapolation.CLAMP);
    return {
      backgroundColor: glowPrimary.value,
      opacity,
      transform: [{ scale }],
    };
  });

  // Ambient Glow transition trigger callback
  const handleActiveMovieChange = React.useCallback((movie: any) => {
    if (movie && movie.genre_ids && movie.genre_ids.length > 0) {
      const firstGenreId = movie.genre_ids[0];
      const genreTheme = GENRE_THEMES[firstGenreId];
      if (genreTheme) {
        glowPrimary.value = withTiming(genreTheme.primary || Colors.primary, { duration: 800 });
        glowSecondary.value = withTiming(genreTheme.secondary || '#9B1B30', { duration: 800 });
      }
    }
  }, []);

  // onViewableItemsChangedHorizontal uses handleActiveMovieChange to sync ambient glow
  const onViewableItemsChangedHorizontal = React.useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      // Find centered item
      const centerIndex = Math.floor(viewableItems.length / 2);
      const centerItem = viewableItems[centerIndex];
      if (centerItem && centerItem.item) {
        handleActiveMovieChange(centerItem.item);
      }
    }
  }, [handleActiveMovieChange]);

  // Cache mapped arrays using useMemo to avoid re-calculating lists and creating new array references on every render
  const storiesData = useMemo(() => {
    return nowPlaying.map(m => ({ id: m.id, title: m.title, poster: m.poster_path || '' }));
  }, [nowPlaying]);

  const movieStoriesData = useMemo(() => {
    return nowPlaying.map(m => ({ 
      id: m.id, 
      title: m.title, 
      poster: m.poster_path || '', 
      overview: m.overview 
    }));
  }, [nowPlaying]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background gap-4">
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ fontFamily: 'Rubik-Regular' }} className="text-body text-textSecondary">טוען סרטים...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Dynamic Ambient Glow Circle (Sits at the back of the screen) */}
      {!isCinematicView && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View 
            style={[
              {
                position: 'absolute',
                top: -150,
                left: '50%',
                marginLeft: -250,
                width: 500,
                height: 500,
                borderRadius: 250,
                opacity: 0.15,
                zIndex: -2,
              },
              ambientGlowStyle
            ]}
          />
          <BlurView 
            intensity={90} 
            tint="dark" 
            style={[StyleSheet.absoluteFill, { zIndex: -1 }]} 
          />
        </View>
      )}

      {/* Scroll-Progress Indicator Bar */}
      {!isCinematicView && (
        <Animated.View 
          style={[
            {
              position: 'absolute',
              top: insets.top,
              left: 0,
              height: 3,
              backgroundColor: '#E5FF00', // Secondary system color
              zIndex: 110,
            },
            progressBarStyle
          ]}
        />
      )}

      {/* Sticky Header Background (Fades in on scroll) */}
      {!isCinematicView && (
        <Animated.View 
          style={[
            { 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: insets.top + 64, 
              zIndex: 90 
            }, 
            stickyHeaderStyle
          ]}
        >
          <BlurView 
            intensity={40} 
            tint="dark" 
            style={StyleSheet.absoluteFill} 
          />
          <View 
            style={{ 
              flex: 1, 
              borderBottomWidth: 1, 
              borderBottomColor: 'rgba(255, 255, 255, 0.08)' 
            }} 
          />
        </Animated.View>
      )}

      {/* Glassmorphic View Mode Toggle Pill */}
      <View 
        style={{ 
          position: 'absolute', 
          top: insets.top + 12, 
          alignSelf: 'center', 
          zIndex: 100,
          width: '90%',
          maxWidth: 320
        }}
      >
        <BlurView 
          intensity={40} 
          tint="dark" 
          className="rounded-full border border-white/10 p-1 flex-row items-center justify-between bg-black/40"
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsCinematicView(false);
            }}
            className="flex-1 py-2.5 rounded-full items-center justify-center"
            style={({ pressed }) => [
              !isCinematicView && { backgroundColor: Colors.primary },
              pressed && { opacity: 0.85 }
            ]}
          >
            <Text 
              className={`font-bold text-[12px] ${!isCinematicView ? 'text-white' : 'text-white/60'}`}
              style={{ fontFamily: 'Rubik-Bold' }}
            >
              🎬 תצוגה רגילה
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsCinematicView(true);
            }}
            className="flex-1 py-2.5 rounded-full items-center justify-center"
            style={({ pressed }) => [
              isCinematicView && { backgroundColor: Colors.primary },
              pressed && { opacity: 0.85 }
            ]}
          >
            <Text 
              className={`font-bold text-[12px] ${isCinematicView ? 'text-white' : 'text-white/60'}`}
              style={{ fontFamily: 'Rubik-Bold' }}
            >
              ✨ גילוי קולנועי
            </Text>
          </Pressable>
        </BlurView>
      </View>

      {isCinematicView ? (
        <CinematicFeed movies={nowPlaying} />
      ) : (
        <Animated.ScrollView
          className="flex-1"
          style={{ paddingTop: insets.top }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {/* Custom Header (LTR, padded pt-16 to clear the floating pill) */}
          <View className="px-6 pt-16 mb-6">
            <View className="flex-1">
              <Text className="text-white/60 font-assistant text-sm text-left">שלום, חובב קולנוע 👋</Text>
              <Text className="text-white text-2xl font-bold font-assistant text-left">הסרטים של CineBook</Text>
            </View>
          </View>

          {/* Stories */}
          {storiesData.length > 0 && (
            <StoriesRow 
              stories={storiesData} 
              onStoryPress={handleStoryPress}
            />
          )}

          {/* Hero */}
          {nowPlaying.length > 0 && (
            <HeroSlider 
              movies={nowPlaying} 
              scrollY={scrollY}
              onActiveMovieChange={handleActiveMovieChange} 
            />
          )}

          {/* Now Playing */}
          <SectionHeader title="🎬 עכשיו בקולנוע" />
          <FlatList
            data={nowPlaying}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => <MovieCard movie={item} index={index} />}
            keyExtractor={(item) => `np-${item.id}`}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            scrollEnabled
            nestedScrollEnabled={true}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={5}
            snapToInterval={CARD_WIDTH + 14}
            decelerationRate="fast"
            snapToAlignment="start"
            onViewableItemsChanged={onViewableItemsChangedHorizontal}
            viewabilityConfig={VIEWABILITY_CONFIG_HORIZONTAL}
          />

          {/* Popular */}
          <SectionHeader title="🔥 פופולרי" />
          <FlatList
            data={popular}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => <MovieCard movie={item} index={index} />}
            keyExtractor={(item) => `pop-${item.id}`}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            scrollEnabled
            nestedScrollEnabled={true}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={5}
            snapToInterval={CARD_WIDTH + 14}
            decelerationRate="fast"
            snapToAlignment="start"
            onViewableItemsChanged={onViewableItemsChangedHorizontal}
            viewabilityConfig={VIEWABILITY_CONFIG_HORIZONTAL}
          />

          {/* Top Rated */}
          <SectionHeader title="⭐ המדורגים ביותר" />
          <FlatList
            data={topRated}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => <MovieCard movie={item} index={index} />}
            keyExtractor={(item) => `tr-${item.id}`}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            scrollEnabled
            nestedScrollEnabled={true}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={5}
            snapToInterval={CARD_WIDTH + 14}
            decelerationRate="fast"
            snapToAlignment="start"
            onViewableItemsChanged={onViewableItemsChangedHorizontal}
            viewabilityConfig={VIEWABILITY_CONFIG_HORIZONTAL}
          />
        </Animated.ScrollView>
      )}

      {/* Floating AI Concierge Button (Only in Classic View) */}
      {!isCinematicView && (
        <View 
          style={{ 
            position: 'absolute', 
            bottom: insets.bottom + 130, 
            right: 20,
            zIndex: 99
          }}
        >
          <AIButton onPress={() => toggleAiModal(true)} />
        </View>
      )}

      {/* Floating Scanner Button (Only in Classic View) */}
      {!isCinematicView && (
        <ScannerButton 
          style={{ 
            position: 'absolute', 
            bottom: insets.bottom + 130, 
            left: 20,
            zIndex: 99
          }}
        />
      )}

      <AIConciergeModal 
        visible={aiModalVisible} 
        onClose={() => toggleAiModal(false)}
        onNavigate={(screen) => {
          const screenMap: Record<string, string> = {
            home: '/(tabs)',
            search: '/(tabs)/search',
            tickets: '/(tabs)/tickets',
            watchlist: '/(tabs)/watchlist',
            profile: '/(tabs)/profile',
          };
          const route = screenMap[screen] || '/(tabs)';
          router.push(route as any);
        }}
      />

      <Modal
        visible={storiesVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={closeStories}
      >
        <MovieStories 
          stories={movieStoriesData}
          initialIndex={selectedStoryIndex}
          onClose={closeStories}
        />
      </Modal>
    </View>
  );
}

