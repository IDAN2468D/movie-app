import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Calendar, ChevronLeft, X } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, POSTER_SIZES } from '@/constants/Theme';
import { type TMDBMovie } from '@/lib/tmdb';

interface SphereMovieModalProps {
  movie: TMDBMovie;
  onClose: () => void;
  onNavigateToDetails: (movieId: number) => void;
}

export const SphereMovieModal: React.FC<SphereMovieModalProps> = ({
  movie,
  onClose,
  onNavigateToDetails,
}) => {
  const handleDetailsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNavigateToDetails(movie.id);
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(400).springify()}
      exiting={FadeOutDown.duration(300)}
      style={styles.cardContainer}
    >
      <BlurView intensity={75} tint="dark" style={styles.blurCard}>
        {/* Close Button */}
        <Pressable
          onPress={onClose}
          style={styles.closeBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={16} color="rgba(255, 255, 255, 0.7)" />
        </Pressable>

        <View style={styles.contentRow}>
          <Image
            source={
              movie.poster_path
                ? { uri: `${POSTER_SIZES.small}${movie.poster_path}` }
                : require('../../assets/images/poster-placeholder.png')
            }
            style={styles.poster}
            resizeMode="cover"
          />

          <View style={styles.infoWrapper}>
            <Text style={styles.title} numberOfLines={1}>
              {movie.title}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.ratingBadge}>
                <Star size={12} color={Colors.secondary} fill={Colors.secondary} />
                <Text style={styles.ratingText}>
                  {movie.vote_average ? movie.vote_average.toFixed(1) : '8.5'}
                </Text>
              </View>

              {movie.release_date && (
                <View style={styles.yearBadge}>
                  <Calendar size={12} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={styles.yearText}>
                    {movie.release_date.split('-')[0]}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.overview} numberOfLines={2}>
              {movie.overview || 'תקציר הסרט אינו זמין כעת.'}
            </Text>

            <Pressable
              onPress={handleDetailsPress}
              style={({ pressed }) => [
                styles.detailsBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <LinearGradient
                colors={[Colors.primary, '#8B152A']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Text style={styles.detailsBtnText}>הצג פרטים מלאים</Text>
              <ChevronLeft size={16} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    zIndex: 100,
  },
  blurCard: {
    padding: 16,
    position: 'relative',
    backgroundColor: 'rgba(18, 18, 20, 0.7)',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 110,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  infoWrapper: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Rubik-Bold',
    marginBottom: 6,
    textAlign: 'left',
    writingDirection: 'rtl',
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 255, 0, 0.15)',
    borderColor: 'rgba(229, 255, 0, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    color: Colors.secondary,
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    marginStart: 4,
  },
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  yearText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontFamily: 'Rubik-Regular',
    marginStart: 4,
  },
  overview: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    lineHeight: 17,
    marginBottom: 12,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  detailsBtn: {
    width: '100%',
    height: 40,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    gap: 6,
  },
  detailsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
  },
});

export default SphereMovieModal;
