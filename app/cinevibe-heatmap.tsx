import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useCineVibeStore, EmotionType } from '../store/useCineVibeStore';
import { EmotionPulseBar } from '../components/cinevibe/EmotionPulseBar';
import { VibeTimelineChart } from '../components/cinevibe/VibeTimelineChart';

export default function CineVibeHeatmapScreen() {
  const router = useRouter();
  const { timeline, addReaction } = useCineVibeStore();

  const handleEmotionSelect = (emotion: EmotionType) => {
    addReaction(75, emotion);
    Alert.alert('תגובתך נקלטה! 🔥', 'התגובה שלך סונכרנה למפת הרגשות הקהילתית.');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'מפת רגשות צופים לאולמות',
          headerStyle: { backgroundColor: '#09090B' },
          headerTintColor: '#FFF',
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBox}>
          <Text style={styles.title}>💓 CineVibe Heatmap</Text>
          <Text style={styles.subtitle}>תגובות בזמן אמת ומפת דופק רגשי של הקהל באולם</Text>
        </View>

        <EmotionPulseBar onSelectEmotion={handleEmotionSelect} />

        <VibeTimelineChart timeline={timeline} />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>חזרה לתפריט</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  scrollContent: {
    padding: 20,
  },
  headerBox: {
    marginBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
  },
  backBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
