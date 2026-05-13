import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';

export const useLogin = () => {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const handleLogin = useCallback(async () => {
    if (!form.email || !form.password) {
      Alert.alert('מידע חסר', 'נא למלא את כל השדות');
      return;
    }

    const result = await login(form.email, form.password);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('שגיאת התחברות', result.message || 'אימייל או סיסמה שגויים');
    }
  }, [form, login, router]);

  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  const navigateToForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return {
    form,
    setForm,
    isLoading,
    handleLogin,
    navigateToRegister,
    navigateToForgotPassword,
  };
};
