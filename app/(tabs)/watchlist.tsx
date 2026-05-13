import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bookmark, Trash2, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Colors, POSTER_SIZES, Typography } from '@/constants/Theme';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { TMDBMovie } from '@/lib/tmdb';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 160;

export default function WatchlistScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { movies, removeFromWatchlist } = useWatchlistStore();

  const handleRemove = (id: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    removeFromWatchlist(id);
  };

  const renderItem = ({ item }: { item: TMDBMovie }) => (
    <Pressable
      onPress={() => router.push(`/movie/${item.id}`)}
      className="flex-row bg-surfaceLight mb-4 rounded-3xl overflow-hidden border border-white/5 mx-5"
      style={{ height: ITEM_HEIGHT }}
    >
      <Image
        source={{ uri: `${POSTER_SIZES.small}${item.poster_path}` }}
        className="w-28 h-full"
        resizeMode="cover"
      />
      
      <View className="flex-1 p-4 justify-between items-start">
        <View className="items-start">
          <Text className="text-white text-h3 font-display text-left" numberOfLines={2}>
            {item.title}
          </Text>
          <Text className="text-textSecondary text-caption mt-1 font-body">
            {item.release_date?.split('-')[0]} • ⭐ {item.vote_average.toFixed(1)}
          </Text>
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            handleRemove(item.id);
          }}
          className="flex-row items-center bg-error/10 px-3 py-1.5 rounded-full"
        >
          <Trash2 size={14} color="#ef4444" />
          <Text className="text-error text-[12px] font-bold ms-1 font-label">הסר</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 py-4">
        <View className="flex-row items-center">
          <View className="bg-primary/20 p-2.5 rounded-2xl me-3">
            <Bookmark size={24} color={Colors.primary} fill={Colors.primary} />
          </View>
          <View>
            <Text className="text-h2 text-white font-display">רשימת צפייה</Text>
            <Text className="text-caption text-textSecondary font-body">הסרטים ששמרת לעצמך</Text>
          </View>
        </View>
      </View>

      {movies.length > 0 ? (
        <FlatList
          data={movies}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 justify-center items-center px-10">
          <View className="bg-surfaceLight p-8 rounded-[40px] mb-6">
            <Bookmark size={60} color={Colors.textMuted} />
          </View>
          <Text className="text-h2 text-white text-center font-display">הרשימה ריקה</Text>
          <Text className="text-body text-textSecondary text-center mt-3 font-body">
            עוד לא הוספת סרטים לרשימת הצפייה שלך. התחל לחקור ולשמור סרטים שמעניינים אותך!
          </Text>
          
          <Pressable
            onPress={() => router.push('/(tabs)/search')}
            className="mt-8 bg-primary px-8 py-3.5 rounded-2xl shadow-lg shadow-primary/20"
          >
            <Text className="text-background font-bold text-h3 font-display">חפש סרטים</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
