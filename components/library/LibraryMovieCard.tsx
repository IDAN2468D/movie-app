import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Star, Calendar, Trash2, Play } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, POSTER_SIZES } from '@/constants/Theme';
import { type TMDBMovie } from '@/lib/tmdb';

const ITEM_HEIGHT = 160;

interface LibraryMovieCardProps {
  movie: TMDBMovie;
  onSelect: (movieId: number) => void;
  onRemove: (movieId: number) => void;
}

export const LibraryMovieCard: React.FC<LibraryMovieCardProps> = ({
  movie,
  onSelect,
  onRemove,
}) => {
  const handleRemovePress = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove(movie.id);
  };

  const handleSelectPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(movie.id);
  };

  return (
    <Pressable
      onPress={handleSelectPress}
      style={styles.cardContainer}
    >
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.contentRow}>
        {/* Poster Image - Left side */}
        <View style={styles.posterWrapper}>
          <Image
            source={{ uri: `${POSTER_SIZES.small}${movie.poster_path}` }}
            style={styles.posterImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Info Area - Right side */}
        <View style={styles.infoWrapper}>
          <View style={styles.topInfo}>
            <Text
              style={styles.movieTitle}
              numberOfLines={2}
            >
              {movie.title}
            </Text>

            <View style={styles.metaRow}>
              {/* Rating */}
              <View style={styles.ratingBadge}>
                <Star size={13} color={Colors.secondary} fill={Colors.secondary} />
                <Text style={styles.ratingText}>
                  {movie.vote_average ? movie.vote_average.toFixed(1) : '8.5'}
                </Text>
              </View>

              {/* Year */}
              {movie.release_date && (
                <View style={styles.yearBadge}>
                  <Calendar size={13} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={styles.yearText}>
                    {movie.release_date.split('-')[0]}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleRemovePress}
              style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Trash2 size={18} color="#FF4444" />
            </Pressable>

            <View style={styles.playBtn}>
              <Play size={14} color="#000" fill="#000" />
              <Text style={styles.playBtnText}>צפה עכשיו</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    height: ITEM_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 14,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
  },
  posterWrapper: {
    width: 115,
    height: '100%',
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  infoWrapper: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topInfo: {
    width: '100%',
    alignItems: 'flex-start',
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Rubik-Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 255, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 255, 0, 0.3)',
  },
  ratingText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Rubik-Medium',
    marginStart: 4,
  },
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  yearText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    marginStart: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  deleteBtn: {
    backgroundColor: 'rgba(255, 68, 68, 0.12)',
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.25)',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  playBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Rubik-Bold',
  },
});

export default LibraryMovieCard;
