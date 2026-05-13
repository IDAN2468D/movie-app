/**
 * MovieCard - Premium glassmorphic movie poster card
 */
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Bookmark } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Typography, POSTER_SIZES } from '@/constants/Theme';
import type { TMDBMovie } from '@/lib/tmdb';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { useAuthStore } from '@/store/useAuthStore';

const CARD_WIDTH = Dimensions.get('window').width * 0.38;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface MovieCardProps {
  movie: TMDBMovie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const router = useRouter();

  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlistStore();
  const toggleFavorite = useAuthStore(state => state.toggleFavorite);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  const isBookmarked = isInWatchlist(movie.id);

  const handlePress = () => {
    router.push(`/movie/${movie.id}`);
  };

  const toggleWatchlist = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Local state update (Full movie object)
    if (isBookmarked) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }

    // Server state update (ID only)
    if (isAuthenticated) {
      toggleFavorite(movie.id);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className="me-3.5"
      style={({ pressed }) => [
        { width: CARD_WIDTH },
        pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }
      ]}
    >
      <View className="rounded-2xl overflow-hidden bg-surfaceLight/10 border border-white/10" style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
        {movie.poster_path ? (
          <Image
            source={{ uri: `${POSTER_SIZES.medium}${movie.poster_path}` }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full justify-center items-center bg-surfaceLight">
            <Text className="text-[40px]">🎬</Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          className="absolute bottom-0 start-0 end-0 h-[50%]"
        />
        
        {/* Rating Badge */}
        <View className="absolute top-2 start-2 flex-row items-center bg-black/40 px-2 py-1 rounded-lg border border-white/10">
          <Star size={10} color={Colors.secondary} fill={Colors.secondary} />
          <Text className="text-[11px] font-bold text-secondary ms-1" style={{ fontFamily: 'Rubik-Bold' }}>
            {movie.vote_average.toFixed(1)}
          </Text>
        </View>
        
        {/* Release Year */}
        <View className="absolute bottom-2 start-2 bg-black/40 px-2 py-1 rounded-lg border border-white/10">
          <Text className="text-[10px] text-white/80" style={{ fontFamily: 'Rubik-Regular' }}>
            {movie.release_date?.split('-')[0]}
          </Text>
        </View>

        <Pressable 
          onPress={toggleWatchlist}
          className="absolute top-2 end-2 bg-black/40 p-2 rounded-full border border-white/10"
          style={({ pressed }) => [pressed && { scale: 0.9, opacity: 0.8 }]}
        >
          <Bookmark 
            size={14} 
            color={isBookmarked ? Colors.primary : "white"} 
            fill={isBookmarked ? Colors.primary : "transparent"} 
          />
        </Pressable>
      </View>
      <Text style={{ fontFamily: 'Rubik-Bold' }} className="text-[14px] text-white mt-2.5 text-right px-1" numberOfLines={1}>
        {movie.title}
      </Text>
    </Pressable>
  );
}

// NativeWind migration complete - styles object removed
