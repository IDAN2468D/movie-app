import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { playLeftSpeakerSound, playRightSpeakerSound, playCenterSubBass } from '../../utils/SoundEffects';

interface GyroSoundStageProps {
  panValue: number;
}

export const GyroSoundStage: React.FC<GyroSoundStageProps> = ({ panValue }) => {
  const leftSpeakerVolume = Math.round(Math.max(0.2, 1 - panValue) * 100);
  const rightSpeakerVolume = Math.round(Math.max(0.2, 1 + panValue) * 100);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🎧 במת שמע תלת-ממדית 120Hz (לחץ לשמיעת צד)</Text>
      <View style={styles.stageRow}>
        <TouchableOpacity
          style={[styles.speakerBox, panValue < -0.2 && styles.activeSpeaker]}
          onPress={playLeftSpeakerSound}
        >
          <Text style={styles.speakerIcon}>🔊 L (שמאל)</Text>
          <Text style={styles.speakerVal}>{leftSpeakerVolume}%</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.centerNode} onPress={playCenterSubBass}>
          <Text style={styles.centerText}>🎯 מרכז (Sub-Bass)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.speakerBox, panValue > 0.2 && styles.activeSpeaker]}
          onPress={playRightSpeakerSound}
        >
          <Text style={styles.speakerIcon}>R (ימין) 🔊</Text>
          <Text style={styles.speakerVal}>{rightSpeakerVolume}%</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speakerBox: {
    width: 95,
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
    backgroundColor: 'rgba(255, 20, 100, 0.25)',
    shadowColor: '#FF1464',
    shadowRadius: 10,
    shadowOpacity: 0.8,
  },
  speakerIcon: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  speakerVal: {
    color: '#E5FF00',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '700',
  },
  centerNode: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  centerText: {
    color: '#F0F0F0',
    fontSize: 11,
    fontWeight: '700',
  },
});
