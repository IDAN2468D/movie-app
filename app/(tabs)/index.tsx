/**
 * Home Screen - Cinematic movie discovery feed
 */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/constants/Theme';
import HeroSlider from '@/components/HeroSlider';
import MovieCard from '@/components/MovieCard';
import SectionHeader from '@/components/SectionHeader';
import { getNowPlaying, getPopular, getTopRated, type TMDBMovie } from '@/lib/tmdb';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [nowPlaying, setNowPlaying] = useState<TMDBMovie[]>([]);
  const [popular, setPopular] = useState<TMDBMovie[]>([]);
  const [topRated, setTopRated] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMovies = async () => {
    try {
      const [np, pop, tr] = await Promise.all([
        getNowPlaying(),
        getPopular(),
        getTopRated(),
      ]);
      setNowPlaying(np);
      setPopular(pop);
      setTopRated(tr);
    } catch (error) {
      console.error('Failed to fetch movies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMovies();
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
    <ScrollView
      className="flex-1 bg-background"
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
  );
}

// NativeWind migration complete - styles object removed
