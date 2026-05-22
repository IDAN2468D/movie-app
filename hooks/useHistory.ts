/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useBookingStore } from '@/store/useBookingStore';

export const useHistory = () => {
  const { myTickets, fetchMyTickets } = useBookingStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyTickets().finally(() => setIsLoading(false));
  }, []);

  const goBack = () => router.back();

  return {
    tickets: myTickets,
    isLoading,
    goBack,
  };
};
