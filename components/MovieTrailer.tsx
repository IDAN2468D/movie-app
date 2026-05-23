import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Image } from 'react-native';
import { TMDBVideo, getMovieVideos } from '@/lib/tmdb';
import { Play, Youtube } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { getImageSource, handleImageError } from '../utils/ImageUtils';
import Trailer4DPlayerModal from './Trailer4DPlayerModal';

interface MovieTrailerProps {
  movieId: number;
  backdropPath: string | null;
  title: string;
}

const MovieTrailer: React.FC<MovieTrailerProps> = ({ movieId, backdropPath, title }) => {
  const [video, setVideo] = useState<TMDBVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageSource, setImageSource] = useState(getImageSource(backdropPath, 'backdrop', 'medium'));
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    getMovieVideos(movieId).then(videos => {
      const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || 
                      videos.find(v => v.site === 'YouTube');
      if (trailer) setVideo(trailer);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [movieId]);

  // עדכון מקור התמונה כאשר backdropPath משתנה
  useEffect(() => {
    setImageSource(getImageSource(backdropPath, 'backdrop', 'medium'));
  }, [backdropPath]);

  const handleOpenTrailer = () => {
    if (video) {
      setModalVisible(true);
    }
  };

  if (!video && !loading) return null;

  return (
    <Animated.View entering={FadeIn.duration(800)} style={styles.container}>
      <View style={styles.card}>
        <Image 
          source={imageSource}
          style={styles.thumbnail}
          resizeMode="cover"
          onError={() => handleImageError(setImageSource, 'backdrop')}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.content}>
          <View className="flex-row items-center gap-2 mb-2">
            <Youtube size={16} color="#FF0000" />
            <Text className="text-white/60 text-[12px] font-bold" style={{ fontFamily: 'Rubik-Bold' }}>OFFICIAL TRAILER</Text>
          </View>
          <Text className="text-white text-[20px] font-bold mb-4" style={{ fontFamily: 'Rubik-Bold' }}>{title}</Text>
          
          <Pressable 
            onPress={handleOpenTrailer}
            className="bg-primary flex-row items-center justify-center py-4 rounded-2xl gap-3 shadow-xl" style={{ shadowColor: Colors.primary, shadowOpacity: 0.2 }}
          >
            <Play size={20} color="white" fill="white" />
            <Text className="text-white font-bold text-[16px]" style={{ fontFamily: 'Rubik-Bold' }}>צפה בטריילר עכשיו (4D)</Text>
          </Pressable>
        </View>
      </View>

      {video && (
        <Trailer4DPlayerModal 
          isVisible={isModalVisible}
          onClose={() => setModalVisible(false)}
          videoKey={video.key}
          title={title}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    height: 220,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
  }
});

export default MovieTrailer;
