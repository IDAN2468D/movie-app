import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CarpoolMapOverlayProps {
  pickupLocation: string;
  destination: string;
  etaMinutes: number;
}

export const CarpoolMapOverlay: React.FC<CarpoolMapOverlayProps> = ({
  pickupLocation,
  destination,
  etaMinutes,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.etaBadge}>⏱️ {etaMinutes} דק' הגעה</Text>
        <Text style={styles.title}>📍 מסלול נסיעה קבוצתי</Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.nodeRow}>
          <View style={[styles.dot, { backgroundColor: '#E5FF00' }]} />
          <Text style={styles.nodeText}>איסוף: {pickupLocation}</Text>
        </View>

        <View style={styles.connectingLine} />

        <View style={styles.nodeRow}>
          <View style={[styles.dot, { backgroundColor: '#FF1464' }]} />
          <Text style={styles.nodeText}>יעד: {destination}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 16,
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  etaBadge: {
    color: '#E5FF00',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(229, 255, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routeContainer: {
    paddingStart: 8,
  },
  nodeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginStart: 8,
  },
  nodeText: {
    color: '#D1D5DB',
    fontSize: 13,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  connectingLine: {
    width: 2,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginStart: 12,
    marginVertical: 2,
  },
});
