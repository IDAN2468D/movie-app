import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useCinePassStore } from '../store/useCinePassStore';
import { NFCTapCard } from '../components/cinepass/NFCTapCard';

export default function CinePassWalletScreen() {
  const router = useRouter();
  const { currentPass, triggerTap, resetTap } = useCinePassStore();

  const handleTap = () => {
    triggerTap();
    Alert.alert('NFC Validated 🔓', 'המנעול האלקטרוני באולם נפתח לחצי דקה!');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'כרטיס NFC & ארנק דיגיטלי',
          headerStyle: { backgroundColor: '#09090B' },
          headerTintColor: '#FFF',
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBox}>
          <Text style={styles.title}>💳 CinePass NFC</Text>
          <Text style={styles.subtitle}>מעבר מהיר באולם ובמתחם ה-VIP בנגישה אחת</Text>
        </View>

        <NFCTapCard
          movieTitle={currentPass.movieTitle}
          hallName={currentPass.hallName}
          seatNumber={currentPass.seatNumber}
          nfcStatus={currentPass.nfcStatus}
          onTap={handleTap}
        />

        {currentPass.nfcStatus === 'granted' && (
          <TouchableOpacity style={styles.resetBtn} onPress={resetTap}>
            <Text style={styles.resetBtnText}>🔄 אפס תהליך כניסה</Text>
          </TouchableOpacity>
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
  resetBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    marginVertical: 8,
  },
  resetBtnText: {
    color: '#E5FF00',
    fontWeight: '600',
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
