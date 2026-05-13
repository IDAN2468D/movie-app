import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useBookingStore, type BookedTicket } from '@/store/useBookingStore';
import { useAuthStore } from '@/store/useAuthStore';

export const useTickets = () => {
  const { myTickets, fetchMyTickets } = useBookingStore();
  const { biometricsEnabled, authenticateBiometrics } = useAuthStore();
  
  const [isUnlocked, setIsUnlocked] = useState(!biometricsEnabled);
  const [selectedTicket, setSelectedTicket] = useState<BookedTicket | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      await fetchMyTickets();
    } catch (error) {
      console.error('[useTickets] Error fetching tickets:', error);
    }
  }, [fetchMyTickets]);

  useEffect(() => {
    if (biometricsEnabled && !isUnlocked) {
      authenticateBiometrics('אימות ביומטרי נדרש לצפייה בכרטיסים שלך').then((success) => {
        setIsUnlocked(success);
        if (success) loadTickets();
      });
    } else {
      setIsUnlocked(true);
      loadTickets();
    }
  }, [biometricsEnabled, loadTickets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  }, [loadTickets]);

  const handleViewTicket = async (ticket: BookedTicket) => {
    if (biometricsEnabled) {
      const success = await authenticateBiometrics(`אימות ביומטרי נדרש לצפייה בכרטיס ל-${ticket.movieTitle}`);
      if (!success) return;
    }
    setSelectedTicket(ticket);
    setIsModalVisible(true);
  };

  const handleScan = (data: string) => {
    setIsScannerVisible(false);
    
    // Find the ticket that matches the scanned ID
    const foundTicket = myTickets.find(t => t.id === data);
    
    setTimeout(() => {
      if (foundTicket) {
        handleViewTicket(foundTicket);
      } else {
        Alert.alert('כרטיס לא נמצא', 'הכרטיס שנסרק אינו מופיע ברשימת הכרטיסים שלך.');
      }
    }, 500);
  };

  const setScannerVisible = (visible: boolean) => {
    setIsScannerVisible(visible);
  };

  const setModalVisible = (visible: boolean) => {
    setIsModalVisible(visible);
  };

  const manualUnlock = () => {
    authenticateBiometrics('אימות ביומטרי נדרש').then(setIsUnlocked);
  };

  return {
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
  };
};
