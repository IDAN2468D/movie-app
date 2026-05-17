import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export const useForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animation values
  const emailScale = useSharedValue(1);

  const animatedEmailStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emailScale.value }],
  }));

  const handleFocus = (field: string) => {
    setFocusedField(field);
    if (field === 'email') emailScale.value = withSpring(1.02);
  };

  const handleBlur = () => {
    setFocusedField(null);
    emailScale.value = withSpring(1);
  };

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
  }, [email]);

  const navigateBack = () => {
    router.back();
  };

  return {
    email,
    setEmail,
    isLoading,
    focusedField,
    handleResetPassword,
    navigateBack,
    handleFocus,
    handleBlur,
    animatedEmailStyle,
  };
};
