import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Play, Pause, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAcousticEngine } from '@/hooks/useAcousticEngine';
import { Colors } from '@/constants/Theme';

export interface GenreFilter {
  id: number | null;
  label: string;
}

const GENRE_OPTIONS: GenreFilter[] = [
  { id: null, label: '✨ הכל' },
  { id: 28, label: '💥 אקשן' },
  { id: 18, label: '🎭 דרמה' },
  { id: 35, label: '😂 קומדיה' },
  { id: 878, label: '🚀 מדע בדיוני' },
  { id: 53, label: '😱 מתח' },
];

interface SphereControlsProps {
  isAutoSpinning: boolean;
  onToggleAutoSpin: () => void;
  selectedGenreId: number | null;
  onSelectGenre: (genreId: number | null) => void;
}

export const SphereControls: React.FC<SphereControlsProps> = ({
  isAutoSpinning,
  onToggleAutoSpin,
  selectedGenreId,
  onSelectGenre,
}) => {
  const { playSpatialClick } = useAcousticEngine();

  const handleAutoSpinPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playSpatialClick();
    onToggleAutoSpin();
  };

  const handleGenrePress = (genreId: number | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playSpatialClick();
    onSelectGenre(genreId);
  };

  return (
    <View style={styles.container}>
      {/* Auto-spin Toggle & Filter Header Row */}
      <View style={styles.controlsRow}>
        <Pressable
          onPress={handleAutoSpinPress}
          style={[styles.autoSpinBtn, isAutoSpinning && styles.autoSpinBtnActive]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isAutoSpinning ? (
            <Pause size={14} color="#FFF" />
          ) : (
            <Play size={14} color={Colors.primary} fill={Colors.primary} />
          )}
          <Text style={[styles.autoSpinText, isAutoSpinning && styles.autoSpinTextActive]}>
            {isAutoSpinning ? 'עצור סיבוב' : 'סובב אוטומטית'}
          </Text>
        </Pressable>
      </View>

      {/* Horizontal Genre Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.genreChipsContainer}
      >
        {GENRE_OPTIONS.map((g) => {
          const isActive = selectedGenreId === g.id;
          return (
            <Pressable
              key={g.label}
              onPress={() => handleGenrePress(g.id)}
              style={[styles.chip, isActive && styles.activeChip]}
            >
              <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                {g.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 90,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  autoSpinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
  },
  autoSpinBtnActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.45)',
    borderColor: Colors.primary,
  },
  autoSpinText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
  },
  autoSpinTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  genreChipsContainer: {
    paddingHorizontal: 4,
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeChip: {
    backgroundColor: 'rgba(139, 92, 246, 0.35)',
    borderColor: Colors.primary,
  },
  chipText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
  },
  activeChipText: {
    color: '#FFFFFF',
    fontFamily: 'Rubik-Bold',
  },
});

export default SphereControls;
