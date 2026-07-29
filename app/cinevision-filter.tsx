import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CinematicFrameOverlay } from '../components/cinevision/CinematicFrameOverlay';
import { AIStampCard } from '../components/cinevision/AIStampCard';

export default function CineVisionFilterScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('cyberpunk');
  const [isMinted, setIsMinted] = useState(false);

  const handleMint = () => {
    setIsMinted(true);
  };

  const handleExport = () => {
    Alert.alert('הצלחה 🌟', 'החותמת הקולנועית נשמרה בהצלחה בגלריה!');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'פילטר וחותמות קולנוע AI',
          headerStyle: { backgroundColor: '#09090B' },
          headerTintColor: '#FFF',
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBox}>
          <Text style={styles.title}>📸 CineVision AI Studio</Text>
          <Text style={styles.subtitle}>צילום בסטייל קולנועי ויצירת חותמת דיגיטלית לסטורי</Text>
        </View>

        <CinematicFrameOverlay selectedFilter={activeFilter} onSelectFilter={setActiveFilter} />

        <TouchableOpacity style={styles.captureBtn} onPress={handleMint}>
          <Text style={styles.captureBtnText}>✨ חתום תמונה ויצור AI Stamp</Text>
        </TouchableOpacity>

        {isMinted && (
          <AIStampCard
            movieTitle="אווטאר: דרך המים"
            filterName={activeFilter}
            stampDate="29 ביולי, 2026"
            onExport={handleExport}
          />
        )}

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
  captureBtn: {
    backgroundColor: '#FF1464',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 12,
  },
  captureBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  backBtn: {
    marginTop: 16,
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
