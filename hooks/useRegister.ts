import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_CONFIG } from '@/constants/Config';

GoogleSignin.configure({
  webClientId: GOOGLE_CONFIG.web,
  offlineAccess: true,
});

export const useRegister = () => {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleRegister = useCallback(async () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      Alert.alert('מידע חסר', 'נא למלא את כל השדות');
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('שגיאה', 'הסיסמאות אינן תואמות');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert('שגיאה', 'הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    const result = await register(form.email, form.password, form.name);
    if (result.success) {
      Alert.alert('הצלחה', 'החשבון נוצר בהצלחה!', [
        { text: 'מצוין', onPress: () => router.replace('/login') }
      ]);
    } else {
      Alert.alert('שגיאת הרשמה', result.message || 'לא ניתן ליצור חשבון כרגע');
    }
  }, [form, register, router]);

  const navigateToLogin = () => {
    router.back();
  };

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      if (response.type !== 'success') {
        throw new Error('Google Sign-In was not successful');
      }

      const idToken = response.data.idToken;
      
      if (!idToken) throw new Error('No ID Token found');

      const result = await useAuthStore.getState().loginWithGoogleToken(idToken);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('שגיאת גוגל', result.message || 'התחברות עם גוגל נכשלה');
      }
    } catch (error: any) {
      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('שגיאת גוגל', 'קרתה שגיאה בתהליך ההתחברות');
      }
    }
  };

  return {
    form,
    setForm,
    isLoading,
    handleRegister,
    navigateToLogin,
    handleGoogleLogin,
  };
};
