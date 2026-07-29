import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GyroSoundStageProps {
  panValue: number;
}

export const GyroSoundStage: React.FC<GyroSoundStageProps> = ({ panValue }) => {
  const leftSpeakerVolume = Math.round(Math.max(0.2, 1 - panValue) * 100);
  const rightSpeakerVolume = Math.round(Math.max(0.2, 1 + panValue) * 100);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🎧 במת שמע תלת-ממדית (Acoustic Stage)</Text>
      <View style={styles.stageRow}>
        <View style={[styles.speakerBox, panValue < -0.2 && styles.activeSpeaker]}>
          <Text style={styles.speakerIcon}>🔊 L</Text>
          <Text style={styles.speakerVal}>{leftSpeakerVolume}%</Text>
        </View>

        <View style={styles.centerNode}>
          <Text style={styles.centerText}>🎯 מרכז</Text>
        </View>

        <View style={[styles.speakerBox, panValue > 0.2 && styles.activeSpeaker]}>
          <Text style={styles.speakerIcon}>R 🔊</Text>
          <Text style={styles.speakerVal}>{rightSpeakerVolume}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginVertical: 8,
  },
  title: {
    color: '#F0F0F0',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 12,
  },
  stageRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speakerBox: {
    width: 80,
    height: 70,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeSpeaker: {
    borderColor: '#FF1464',
    backgroundColor: 'rgba(255, 20, 100, 0.15)',
    shadowColor: '#FF1464',
    shadowRadius: 8,
    shadowOpacity: 0.5,
  },
  speakerIcon: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  speakerVal: {
    color: '#E5FF00',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  centerNode: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  centerText: {
    color: '#F0F0F0',
    fontSize: 12,
    fontWeight: '600',
  },
});
