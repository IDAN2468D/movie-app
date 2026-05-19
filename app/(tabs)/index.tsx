import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
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
        <ScrollView
          className="flex-1"
          style={{ paddingTop: insets.top }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
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
          {nowPlaying.length > 0 && <HeroSlider movies={nowPlaying} />}

          {/* Now Playing */}
          <SectionHeader title="🎬 עכשיו בקולנוע" />
          <FlatList
            data={nowPlaying}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <MovieCard movie={item} />}
            keyExtractor={(item) => `np-${item.id}`}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            scrollEnabled
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={3}
            removeClippedSubviews={true}
          />

          {/* Popular */}
          <SectionHeader title="🔥 פופולרי" />
          <FlatList
            data={popular}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <MovieCard movie={item} />}
            keyExtractor={(item) => `pop-${item.id}`}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            scrollEnabled
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={3}
            removeClippedSubviews={true}
          />

          {/* Top Rated */}
          <SectionHeader title="⭐ המדורגים ביותר" />
          <FlatList
            data={topRated}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <MovieCard movie={item} />}
            keyExtractor={(item) => `tr-${item.id}`}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            scrollEnabled
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={3}
            removeClippedSubviews={true}
          />
        </ScrollView>
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

