/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useBookingStore } from '@/store/useBookingStore';

export const useHistory = () => {
  const myTickets = useBookingStore(state => state.myTickets);
  const fetchMyTickets = useBookingStore(state => state.fetchMyTickets);
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
