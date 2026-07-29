import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface CinematicFrameOverlayProps {
  selectedFilter: string;
  onSelectFilter: (filterId: string) => void;
}

const FILTERS = [
  { id: 'cyberpunk', name: '⚡ ניאון סייבר' },
  { id: 'noir', name: '🎬 פילם נואר' },
  { id: 'fantasy', name: '✨ פנטזיה אפית' },
];

export const CinematicFrameOverlay: React.FC<CinematicFrameOverlayProps> = ({
  selectedFilter,
  onSelectFilter,
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.viewfinderBox}>
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <Text style={styles.recText}>● REC 4K</Text>
      </View>

      <View style={styles.filterBar}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterBtn, selectedFilter === f.id && styles.activeFilterBtn]}
            onPress={() => onSelectFilter(f.id)}
          >
            <Text style={[styles.filterText, selectedFilter === f.id && styles.activeFilterText]}>
              {f.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    width: '100%',
    height: 260,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  viewfinderBox: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: '#FF1464',
  },
  topRight: { top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2 },
  topLeft: { top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2 },
  bottomRight: { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2 },
  bottomLeft: { bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2 },
  recText: {
    color: '#FF1464',
    fontSize: 11,
    fontWeight: '800',
    alignSelf: 'flex-start',
  },
  filterBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeFilterBtn: {
    backgroundColor: '#FF1464',
  },
  filterText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#FFF',
  },
});
