/**
 * Tickets Screen - My booked tickets
 */
import React from 'react';
import { View, Text, ScrollView, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ticket, Scan } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import MarkerHighlight from '@/components/MarkerHighlight';
import TicketCard from '@/components/TicketCard';
import TicketDetailModal from '@/components/TicketDetailModal';
import TicketScannerModal from '@/components/TicketScannerModal';
import { useTickets } from '@/hooks/useTickets';
import type { BookedTicket } from '@/store/useBookingStore';

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  const {
    myTickets,
    isUnlocked,
    selectedTicket,
    isModalVisible,
    isScannerVisible,
    refreshing,
    onRefresh,
    handleViewTicket,
    handleScan,
    setScannerVisible,
    setModalVisible,
    manualUnlock,
  } = useTickets();

  const renderTicketItem = React.useCallback(({ item, index }: { item: BookedTicket; index: number }) => (
    <TicketCard ticket={item} index={index} onPress={() => handleViewTicket(item)} />
  ), [handleViewTicket]);

  if (!isUnlocked) {
    return (
      <View className="flex-1 bg-background px-5 justify-center items-center">
        <Pressable 
          onPress={manualUnlock}
          className="bg-primary/20 p-8 rounded-[40px] border border-primary/30 items-center"
        >
          <Ticket size={48} color={Colors.primary} />
          <Text style={{ fontFamily: 'Rubik-Medium', fontSize: 18, color: 'white', marginTop: 16 }}>נדרש אימות ביומטרי</Text>
          <Text className="text-white/40 mt-2">לחץ כאן כדי לנסות שוב</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-5" style={{ paddingTop: insets.top + 20 }}>
      {myTickets.length > 0 ? (
        <FlatList
          data={myTickets}
          keyExtractor={(item) => item.id || Math.random().toString()}
          ListHeaderComponent={
            <View className="pt-2 mb-6">
              <MarkerHighlight text="הכרטיסים שלי" className="text-h1 text-text" color={Colors.secondary} />
            </View>
          }
          renderItem={renderTicketItem}
          contentContainerStyle={{ 
            paddingBottom: insets.bottom + 120,
            gap: 20
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        />
      ) : (
        <>
          <MarkerHighlight text="הכרטיסים שלי" className="text-h1 text-text mb-5" color={Colors.secondary} />
          <ScrollView 
            contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
            }
          >
            <View className="flex-1 justify-center items-center gap-3 mb-[100px]">
              <Ticket size={64} color={Colors.primary} />
              <MarkerHighlight text="אין כרטיסים עדיין" className="text-h2 text-text mt-6 text-center" />
              <Text className="text-body text-textMuted mt-2 text-center font-body">כרטיסים שתזמינו יופיעו כאן</Text>
            </View>
          </ScrollView>
        </>
      )}

      <TicketDetailModal 
        ticket={selectedTicket}
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
      />

      <TicketScannerModal 
        isVisible={isScannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={handleScan}
      />

      {/* Floating Scan Button */}
      <Pressable
        onPress={() => setScannerVisible(true)}
        className="absolute bottom-40 end-6 w-16 h-16 rounded-full bg-primary items-center justify-center shadow-2xl"
        style={({ pressed }: { pressed: boolean }) => [
          { shadowColor: Colors.primary, shadowOpacity: 0.4 },
          { transform: [{ scale: pressed ? 0.9 : 1 }] }
        ]}
      >
        <Scan size={28} color={Colors.background} />
      </Pressable>
    </View>
  );
}
