import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import NotificationService from '@/services/NotificationService';

export const useNotifications = () => {
  const [reminders, setReminders] = useState(true);
  const [promos, setPromos] = useState(false);
  const [news, setNews] = useState(true);

  const toggleReminders = useCallback((value: boolean) => {
    Haptics.selectionAsync();
    setReminders(value);
  }, []);

  const togglePromos = useCallback((value: boolean) => {
    Haptics.selectionAsync();
    setPromos(value);
    if (value) {
      NotificationService.notifyPromoDeals();
    }
  }, []);

  const toggleNews = useCallback((value: boolean) => {
    Haptics.selectionAsync();
    setNews(value);
  }, []);

  const goBack = () => router.back();

  return {
    reminders,
    promos,
    news,
    toggleReminders,
    togglePromos,
    toggleNews,
    goBack,
  };
};
