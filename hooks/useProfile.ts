/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useBookingStore } from '@/store/useBookingStore';
import { API_BASE_URL } from '@/constants/Config';

export const useProfile = () => {
  const { user, isAuthenticated, logout, token, resetOnboarding } = useAuthStore();
  const { myTickets, fetchMyTickets } = useBookingStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyTickets();
    }
  }, [isAuthenticated, fetchMyTickets]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.replace('/(auth)/login' as any);
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להתנתק כעת');
    }
  }, [logout, router]);

  const sendTestEmail = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/test-email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        Alert.alert('הצלחה', 'מייל בדיקה נשלח בהצלחה! בדוק את תיבת הדואר שלך.');
      } else {
        Alert.alert('שגיאה', result.message || 'שגיאה בשליחת מייל בדיקה');
      }
    } catch (e) {
      Alert.alert('שגיאה', 'לא ניתן להתחבר לשרת');
    }
  }, [token]);

  const handleResetOnboarding = useCallback(async () => {
    await resetOnboarding();
    Alert.alert('בוצע', 'מצב ה-Onboarding הופס. בפעם הבאה שתפעיל את האפליקציה תראה את המדריך.');
  }, [resetOnboarding]);

  const navigateToSettings = (path: string) => {
    router.push(path as any);
  };

  return {
    user,
    isAuthenticated,
    myTickets,
    handleLogout,
    sendTestEmail,
    handleResetOnboarding,
    navigateToSettings,
  };
};
