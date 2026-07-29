import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface AIStampCardProps {
  movieTitle: string;
  filterName: string;
  stampDate: string;
  onExport: () => void;
}

export const AIStampCard: React.FC<AIStampCardProps> = ({
  movieTitle,
  filterName,
  stampDate,
  onExport,
}) => {
  return (
    <View style={styles.stampOuter}>
      <View style={styles.stampInner}>
        <View style={styles.stampHeader}>
          <Text style={styles.stampBadge}>CINESTAMP 🎟️</Text>
          <Text style={styles.stampDate}>{stampDate}</Text>
        </View>

        <Text style={styles.movieTitle}>{movieTitle}</Text>
        <Text style={styles.filterTag}>פילטר: {filterName}</Text>

        <TouchableOpacity style={styles.exportBtn} onPress={onExport}>
          <Text style={styles.exportBtnText}>📲 ייצוא ל-Story / גלריה</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stampOuter: {
    backgroundColor: '#1E1E21',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5FF00',
    padding: 16,
    marginVertical: 12,
    shadowColor: '#E5FF00',
    shadowRadius: 12,
    shadowOpacity: 0.3,
  },
  stampInner: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    padding: 14,
  },
  stampHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stampBadge: {
    color: '#E5FF00',
    fontSize: 12,
    fontWeight: '800',
  },
  stampDate: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  movieTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  filterTag: {
    color: '#8B5CF6',
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
    marginBottom: 12,
  },
  exportBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  exportBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
