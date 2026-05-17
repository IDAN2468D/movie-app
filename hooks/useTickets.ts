import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { type BookedTicket } from '@/store/useBookingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyTicketsQuery } from '@/hooks/useServerQueries';

export const useTickets = () => {
  const { data: myTickets = [], refetch, isLoading } = useMyTicketsQuery();
  const { biometricsEnabled, authenticateBiometrics } = useAuthStore();
  
  const [isUnlocked, setIsUnlocked] = useState(!biometricsEnabled);
  const [selectedTicket, setSelectedTicket] = useState<BookedTicket | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (biometricsEnabled && !isUnlocked) {
      authenticateBiometrics('אימות ביומטרי נדרש לצפייה בכרטיסים שלך').then((success) => {
        setIsUnlocked(success);
      });
    } else {
      setIsUnlocked(true);
    }
  }, [biometricsEnabled]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (e) {
      console.error('[useTickets] refresh error:', e);
    }
    setRefreshing(false);
  }, [refetch]);

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
    const foundTicket = myTickets.find((t: any) => t.id === data || t._id === data);
    
    setTimeout(() => {
      if (foundTicket) {
        handleViewTicket(foundTicket as BookedTicket);
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
    myTickets: myTickets as BookedTicket[],
    isUnlocked,
    selectedTicket,
    isModalVisible,
    isScannerVisible,
    refreshing: refreshing || isLoading,
    onRefresh,
    handleViewTicket,
    handleScan,
    setScannerVisible,
    setModalVisible,
    manualUnlock,
  };
};
