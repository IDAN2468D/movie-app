import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EmotionType } from '../../store/useCineVibeStore';

interface EmotionPulseBarProps {
  onSelectEmotion: (emotion: EmotionType) => void;
}

const EMOTIONS: { type: EmotionType; label: string; icon: string; color: string }[] = [
  { type: 'hype', label: 'טירוף', icon: '🔥', color: '#FF1464' },
  { type: 'shock', label: 'הלם', icon: '😱', color: '#E5FF00' },
  { type: 'laughter', label: 'צחוק', icon: '😂', color: '#0AEFFF' },
  { type: 'tears', label: 'דמעות', icon: '😭', color: '#8B5CF6' },
];

export const EmotionPulseBar: React.FC<EmotionPulseBarProps> = ({ onSelectEmotion }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>💓 איך הרגשת בסצנה הזו?</Text>
      <View style={styles.barRow}>
        {EMOTIONS.map((e) => (
          <TouchableOpacity
            key={e.type}
            style={[styles.btn, { borderColor: e.color }]}
            onPress={() => onSelectEmotion(e.type)}
          >
            <Text style={styles.icon}>{e.icon}</Text>
            <Text style={styles.label}>{e.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 16,
    marginVertical: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 12,
  },
  barRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  btn: {
    width: '23%',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
  },
  label: {
    color: '#F0F0F0',
    fontSize: 12,
    fontWeight: '600',
  },
});
