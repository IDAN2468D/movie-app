import React, { useState } from 'react';
import { View, Text, Pressable, I18nManager } from 'react-native';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/constants/Theme';
import { useHistory } from '@/hooks/useHistory';
import CineChronicle from '@/components/CineChronicle';
import TicketDetailModal from '@/components/TicketDetailModal';
import type { BookedTicket } from '@/store/useBookingStore';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { tickets: myTickets, isLoading, goBack } = useHistory();
  const [selectedTicket, setSelectedTicket] = useState<BookedTicket | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handlePressTicket = (ticket: BookedTicket) => {
    setSelectedTicket(ticket);
    setIsModalVisible(true);
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-white/10 relative">
        <Pressable onPress={goBack} className="w-10 h-10 rounded-full bg-white/5 justify-center items-center z-10">
          {I18nManager.isRTL ? <ChevronRight size={24} color={Colors.text} /> : <ChevronLeft size={24} color={Colors.text} />}
        </Pressable>
        <View className="absolute inset-0 justify-center items-center">
          <Text style={[Typography.h2, { fontFamily: 'Rubik-Bold' }]} className="text-white">
            היסטוריית הזמנות
          </Text>
        </View>
      </View>
      
      <View className="flex-1 justify-center py-6">
        {isLoading && myTickets.length === 0 ? (
          <Text style={[Typography.body, { fontFamily: 'Rubik-Regular', textAlign: 'center' }]} className="text-white/50">
            טוען כרטיסים...
          </Text>
        ) : myTickets.length === 0 ? (
          <Text style={[Typography.body, { fontFamily: 'Rubik-Regular', textAlign: 'center' }]} className="text-white/50">
            אין כרטיסים בהיסטוריה שלך
          </Text>
        ) : (
          <CineChronicle tickets={myTickets} onPressTicket={handlePressTicket} />
        )}
      </View>

      <TicketDetailModal 
        ticket={selectedTicket}
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </View>
  );
}

