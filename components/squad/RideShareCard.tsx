import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface RideShareCardProps {
  driverName: string;
  seatsAvailable: number;
  passengersCount: number;
  costPerPerson: number;
  onJoinRide: () => void;
}

export const RideShareCard: React.FC<RideShareCardProps> = ({
  driverName,
  seatsAvailable,
  passengersCount,
  costPerPerson,
  onJoinRide,
}) => {
  const isFull = passengersCount >= seatsAvailable;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.costBadge}>
          <Text style={styles.costText}>₪{costPerPerson} / נוסע</Text>
        </View>
        <Text style={styles.driverName}>🚘 נהג: {driverName}</Text>
      </View>

      <Text style={styles.seatsText}>
        מקומות תפוסים: {passengersCount} מתוך {seatsAvailable}
      </Text>

      <TouchableOpacity
        style={[styles.actionBtn, isFull && styles.disabledBtn]}
        onPress={onJoinRide}
        disabled={isFull}
      >
        <Text style={styles.actionBtnText}>
          {isFull ? '🔒 הנסיעה מלאה' : '✨ הצטרף לנסיעה הקבוצתית'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 16,
    marginVertical: 8,
  },
  topRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  costBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  costText: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '700',
  },
  seatsText: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginVertical: 10,
  },
  actionBtn: {
    backgroundColor: '#FF1464',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
