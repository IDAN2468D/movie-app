import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

export const useForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = useCallback(async () => {
    if (!email) {
      Alert.alert('מידע חסר', 'נא להזין כתובת אימייל');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'אימייל נשלח',
        'שלחנו לך הוראות לאיפוס הסיסמה לכתובת האימייל שהזנת.',
        [{ text: 'חזרה להתחברות', onPress: () => router.back() }]
      );
    }, 2000);
  }, [email, router]);

  const navigateBack = () => {
    router.back();
  };

  return {
    email,
    setEmail,
    isLoading,
    handleResetPassword,
    navigateBack,
  };
};
