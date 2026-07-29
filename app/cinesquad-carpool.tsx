import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSquadTransitStore } from '../store/useSquadTransitStore';
import { CarpoolMapOverlay } from '../components/squad/CarpoolMapOverlay';
import { RideShareCard } from '../components/squad/RideShareCard';

export default function CineSquadCarpoolScreen() {
  const router = useRouter();
  const { activeRide, addPassenger } = useSquadTransitStore();

  const handleJoin = () => {
    addPassenger('משתמש נוכחי');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'נסיעה קבוצתית לקולנוע',
          headerStyle: { backgroundColor: '#09090B' },
          headerTintColor: '#FFF',
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBox}>
          <Text style={styles.title}>🚘 CineSquad Carpool</Text>
          <Text style={styles.subtitle}>נסיעות משותפות, חיסכון בעלויות והגעה בזמן לקולנוע</Text>
        </View>

        {activeRide && (
          <>
            <CarpoolMapOverlay
              pickupLocation={activeRide.pickupLocation}
              destination="יס פלאנט ראשון לציון"
              etaMinutes={18}
            />

            <RideShareCard
              driverName={activeRide.driverName}
              seatsAvailable={activeRide.seatsAvailable}
              passengersCount={activeRide.passengers.length}
              costPerPerson={activeRide.costPerPerson}
              onJoinRide={handleJoin}
            />

            <View style={styles.passengerSection}>
              <Text style={styles.sectionTitle}>👥 נוסעים רשומים:</Text>
              {activeRide.passengers.map((name, index) => (
                <View key={index} style={styles.passengerChip}>
                  <Text style={styles.passengerText}>👤 {name}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>חזרה לתפריט ראשי</Text>
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
  passengerSection: {
    marginTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    color: '#F0F0F0',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  passengerChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginVertical: 3,
    alignSelf: 'flex-end',
  },
  passengerText: {
    color: '#E5FF00',
    fontSize: 13,
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
