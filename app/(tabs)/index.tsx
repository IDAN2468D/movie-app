/**
 * Home Screen - Cinematic movie discovery feed
 */
import {
  View,
  Text,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Theme';
import HeroSlider from '@/components/HeroSlider';
import MovieCard from '@/components/MovieCard';
import SectionHeader from '@/components/SectionHeader';
import AIConciergeModal from '@/components/AIConciergeModal';
import { AIButton } from '@/components/AIButton';
import { useHome } from '@/hooks/useHome';

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
    </View>
  );
}
