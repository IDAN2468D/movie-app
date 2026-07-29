/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Library, Search, Sparkles, BookOpen, Gift, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/Theme';
import { useWatchlistScreen } from '@/hooks/useWatchlistScreen';
import LibraryStatsCard from '@/components/library/LibraryStatsCard';
import LibraryCategoryTabs, { LibraryCategory } from '@/components/library/LibraryCategoryTabs';
import LibraryMovieCard from '@/components/library/LibraryMovieCard';

export default function WatchlistScreen() {
  const insets = useSafeAreaInsets();
  const { movies, handleRemove } = useWatchlistScreen();

  const [activeTab, setActiveTab] = useState<LibraryCategory>('watchlist');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Filter movies based on search query
  const filteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return movies;
    return movies.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [movies, searchQuery]);

  const totalWatchHours = useMemo(() => {
    return Math.round(movies.length * 2.1);
  }, [movies.length]);

  const handleSelectMovie = (movieId: number) => {
    router.push(`/movie/${movieId}` as any);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Title & Badge */}
      <View style={styles.titleRow}>
        <View style={styles.titleTextGroup}>
          <Text style={styles.mainTitle}>ספריית הקולנוע</Text>
          <Text style={styles.subTitle}>{movies.length} סרטים באוסף האישי שלך</Text>
        </View>
        <View style={styles.headerIconWrapper}>
          <Library size={24} color={Colors.primary} />
        </View>
      </View>

      {/* Stats Summary Card */}
      <LibraryStatsCard
        movieCount={movies.length}
        totalHours={totalWatchHours}
        collectiblesCount={3}
      />

      {/* Sub Category Switcher Tabs */}
      <LibraryCategoryTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'journal') {
            router.push('/cinejournal' as any);
          } else if (tab === 'collectibles') {
            router.push('/cinecollect' as any);
          } else {
            setActiveTab(tab);
          }
        }}
      />

      {/* Search Input Bar (Only when in Watchlist tab) */}
      {activeTab === 'watchlist' && (
        <View style={styles.searchBarWrapper}>
          <BlurView intensity={25} tint="dark" style={styles.searchBlur}>
            <Search size={18} color="rgba(255, 255, 255, 0.4)" style={{ marginEnd: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="חפש בספרייה האישית שלך..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              textAlign="right"
            />
          </BlurView>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background Visual Accents */}
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      {activeTab === 'watchlist' && (
        <FlatList
          data={filteredMovies}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <LibraryMovieCard
              movie={item}
              onSelect={handleSelectMovie}
              onRemove={handleRemove}
            />
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Library size={48} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>הספרייה שלך ריקה</Text>
                <Text style={styles.emptyDescription}>
                  עדיין לא הוספת סרטים לספרייה האישית שלך.{"\n"}גלה סרטים חדשים והוסף אותם עכשיו!
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/search')}
                  style={styles.exploreBtn}
                >
                  <Text style={styles.exploreBtnText}>גלה סרטים בקטלוג</Text>
                </Pressable>
              </BlurView>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bgGlowTop: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: 80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(229, 255, 0, 0.06)',
  },
  headerContainer: {
    paddingTop: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleTextGroup: {
    alignItems: 'flex-start',
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Rubik-Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subTitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrapper: {
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  searchBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
  },
  emptyContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  emptyCard: {
    width: '100%',
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Rubik-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 18,
  },
  exploreBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Rubik-Bold',
  },
});
