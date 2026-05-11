/**
 * Tickets Screen - My booked tickets
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ticket } from 'lucide-react-native';
import { Colors, Typography } from '@/constants/Theme';
import MarkerHighlight from '@/components/MarkerHighlight';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuthStore } from '@/store/useAuthStore';
import TicketCard from '@/components/TicketCard';

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  const { myTickets } = useBookingStore();
  const { biometricsEnabled, authenticateBiometrics } = useAuthStore();
  const [isUnlocked, setIsUnlocked] = React.useState(!biometricsEnabled);

  React.useEffect(() => {
    if (biometricsEnabled && !isUnlocked) {
      authenticateBiometrics('אימות ביומטרי נדרש לצפייה בכרטיסים שלך').then((success) => {
        setIsUnlocked(success);
      });
    } else {
      setIsUnlocked(true);
    }
  }, [biometricsEnabled]);

  if (!isUnlocked) {
    return (
      <View className="flex-1 bg-background px-5 justify-center items-center">
        <Text style={{ fontFamily: 'Rubik-Medium', fontSize: 18, color: 'white' }}>נדרש אימות ביומטרי כדי לצפות בכרטיסים</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-5" style={{ paddingTop: insets.top + 20 }}>
      <MarkerHighlight text="הכרטיסים שלי" className="text-h1 text-text mb-5" color={Colors.secondary} />
      
      {myTickets.length > 0 ? (
        <FlatList
          data={myTickets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TicketCard ticket={item} />}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 justify-center items-center gap-3 mb-[100px]">
          <Ticket size={64} color={Colors.primary} />
          <MarkerHighlight text="אין כרטיסים עדיין" className="text-h2 text-text mt-6 text-center" />
          <Text className="text-body text-textMuted mt-2 text-center font-body">כרטיסים שתזמינו יופיעו כאן</Text>
        </View>
      )}
    </View>
  );
}

// NativeWind migration complete - styles object removed
