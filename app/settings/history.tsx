import React, { useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Ticket, Calendar, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/constants/Theme';
import { useBookingStore } from '@/store/useBookingStore';

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { myTickets, fetchMyTickets } = useBookingStore();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    fetchMyTickets().finally(() => setIsLoading(false));
  }, []);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-white/10 relative">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 justify-center items-center z-10">
          <ChevronRight size={24} color={Colors.text} />
        </Pressable>
        <View className="absolute inset-0 justify-center items-center">
          <Text style={[Typography.h2, { fontFamily: 'Rubik-Bold' }]} className="text-white">
            היסטוריית הזמנות
          </Text>
        </View>
      </View>
      
      <ScrollView className="flex-1 px-5 py-6">
        {isLoading && myTickets.length === 0 ? (
          <Text style={[Typography.body, { fontFamily: 'Rubik-Regular', textAlign: 'center' }]} className="text-white/50 mt-10">
            טוען כרטיסים...
          </Text>
        ) : myTickets.length === 0 ? (
          <Text style={[Typography.body, { fontFamily: 'Rubik-Regular', textAlign: 'center' }]} className="text-white/50 mt-10">
            אין כרטיסים בהיסטוריה שלך
          </Text>
        ) : (
          myTickets.map((ticket) => (
            <View key={ticket.id} className="rounded-2xl border border-white/10 p-5 mb-4 overflow-hidden bg-surfaceLight">
              <View className="flex-row items-center justify-between border-b border-white/10 pb-4 mb-4">
                <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 18, color: 'white' }}>{ticket.movieTitle}</Text>
                <View className="bg-primary/20 px-3 py-1 rounded-full">
                  <Text style={{ fontFamily: 'Rubik-Medium', fontSize: 12, color: Colors.primary }}>{ticket.seats.length} כרטיסים</Text>
                </View>
              </View>
              
              <View className="flex-row justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <Calendar size={16} color="rgba(255,255,255,0.5)" />
                  <Text style={{ fontFamily: 'Rubik-Regular', color: 'white' }}>{ticket.date}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Clock size={16} color="rgba(255,255,255,0.5)" />
                  <Text style={{ fontFamily: 'Anton-Regular', color: 'white', marginTop: 2 }}>{ticket.showtime.time}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2">
                <Ticket size={16} color={Colors.secondary} />
                <Text style={{ fontFamily: 'Rubik-Medium', color: Colors.secondary }}>
                  כסאות: {ticket.seats.map(s => `${s.row}${s.number}`).join(', ')}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
