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
import { useRouter } from 'expo-router';
import { TrendingUp } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Theme';
import HeroSlider from '@/components/HeroSlider';
import MovieCard from '@/components/MovieCard';
import SectionHeader from '@/components/SectionHeader';
import AIConciergeModal from '@/components/AIConciergeModal';
import { AIButton } from '@/components/AIButton';
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
    onRefresh,
    toggleAiModal,
  } = useHome();
  const router = useRouter();

  const [storiesVisible, setStoriesVisible] = React.useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = React.useState(0);

  const handleStoryPress = (index: number) => {
    setSelectedStoryIndex(index);
    setStoriesVisible(true);
  };

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
        <View className="flex-row items-center px-6 pt-4 mb-6">
          <TouchableOpacity 
            onPress={() => router.push('/analytics')}
            className="bg-primary/20 p-3 rounded-2xl border border-primary/30 mr-4"
          >
            <TrendingUp size={24} color="#E50914" />
          </TouchableOpacity>
          <View>
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

      <AIConciergeModal 
        visible={aiModalVisible} 
        onClose={() => toggleAiModal(false)} 
      />

      <Modal
        visible={storiesVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setStoriesVisible(false)}
      >
        <MovieStories 
          stories={nowPlaying.map(m => ({ 
            id: m.id, 
            title: m.title, 
            poster: m.poster_path || '', 
            overview: m.overview 
          }))}
          initialIndex={selectedStoryIndex}
          onClose={() => setStoriesVisible(false)}
        />
      </Modal>
    </View>
  );
}
