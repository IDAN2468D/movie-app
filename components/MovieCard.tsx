/**
 * MovieCard - Premium glassmorphic movie poster card
 */
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors, Radius, Typography, POSTER_SIZES } from '@/constants/Theme';
import type { TMDBMovie } from '@/lib/tmdb';

const CARD_WIDTH = Dimensions.get('window').width * 0.38;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface MovieCardProps {
  movie: TMDBMovie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/movie/${movie.id}`);
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
      <View className="rounded-xl overflow-hidden bg-surface" style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
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
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          className="absolute bottom-0 start-0 end-0 h-[40%]"
        />
        <View className="absolute top-2 start-2 flex-row items-center bg-surface px-2 py-1 rounded-full gap-1">
          <Star size={10} color={Colors.secondary} fill={Colors.secondary} />
          <Text className="text-[11px] font-bold text-secondary font-body">{movie.vote_average.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={{ fontFamily: 'Rubik-Medium' }} className="text-[13px] text-white mt-2 w-full" numberOfLines={1} ellipsizeMode="tail">
        {movie.title.length > 20 ? `${movie.title.substring(0, 20)}...` : movie.title}
      </Text>
    </Pressable>
  );
}

// NativeWind migration complete - styles object removed
