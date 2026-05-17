/**
 * Home Screen - Cinematic movie discovery feed
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { TrendingUp, Moon, MapPin } from 'lucide-react-native';
import { usePremiumStore } from '@/store/usePremiumStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
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
  const { isInTheaterMode, toggleInTheaterMode } = usePremiumStore();

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
        {/* Custom Header (LTR) */}
        <View className="px-6 pt-4 mb-6">
          <View className="flex-1">
            <Text className="text-white/60 font-assistant text-sm text-left">שלום, חובב קולנוע 👋</Text>
            <Text className="text-white text-2xl font-bold font-assistant text-left">הסרטים של CineBook</Text>
          </View>
        </View>

        {/* Stories */}
        {nowPlaying.length > 0 && (
          <StoriesRow 
            stories={nowPlaying.map(m => ({ id: m.id, title: m.title, poster: m.poster_path || '' }))} 
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
        />
      </ScrollView>

      {/* Floating AI Concierge Button */}
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

      {/* Floating Scanner Button */}
      <ScannerButton 
        style={{ 
          position: 'absolute', 
          bottom: insets.bottom + 130, 
          left: 20,
          zIndex: 99
        }}
      />

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
          stories={nowPlaying.map(m => ({ 
            id: m.id, 
            title: m.title, 
            poster: m.poster_path || '', 
            overview: m.overview 
          }))}
          initialIndex={selectedStoryIndex}
          onClose={closeStories}
        />
      </Modal>
    </View>
  );
}
