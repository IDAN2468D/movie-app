import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Film, Clock, Award, Bookmark } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';

interface LibraryStatsCardProps {
  movieCount: number;
  totalHours: number;
  collectiblesCount?: number;
}

export const LibraryStatsCard: React.FC<LibraryStatsCardProps> = ({
  movieCount,
  totalHours,
  collectiblesCount = 3,
}) => {
  return (
    <View style={styles.container}>
      <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
        <View style={styles.statItem}>
          <View style={styles.iconCircle}>
            <Bookmark size={16} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{movieCount}</Text>
          <Text style={styles.statLabel}>שמורים</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <View style={styles.iconCircle}>
            <Clock size={16} color={Colors.secondary} />
          </View>
          <Text style={styles.statValue}>{totalHours}ש'</Text>
          <Text style={styles.statLabel}>זמן צפייה</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <View style={styles.iconCircle}>
            <Award size={16} color="#0AEFFF" />
          </View>
          <Text style={styles.statValue}>{collectiblesCount}</Text>
          <Text style={styles.statLabel}>מזכרות</Text>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  blurContainer: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Rubik-Bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Rubik-Regular',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default LibraryStatsCard;
