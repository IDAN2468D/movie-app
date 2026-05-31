import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { GoogleSignin, isGoogleSigninAvailable } from '@/utils/safeGoogleSignin';
import { GOOGLE_CONFIG } from '@/constants/Config';
import { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';

GoogleSignin.configure({
  webClientId: GOOGLE_CONFIG.web,
  offlineAccess: true,
});

export const useRegister = () => {
  const { register, isLoading } = useAuthStore();
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animated focus styles
  const nameScale = useSharedValue(1);
  const emailScale = useSharedValue(1);
  const passScale = useSharedValue(1);

  const onFocus = (field: string) => {
    setFocusedField(field);
    if (field === 'name') nameScale.value = withSpring(1.02);
    if (field === 'email') emailScale.value = withSpring(1.02);
    if (field === 'password' || field === 'confirmPassword') passScale.value = withSpring(1.02);
  };

  const onBlur = () => {
    setFocusedField(null);
    nameScale.value = withSpring(1);
    emailScale.value = withSpring(1);
    passScale.value = withSpring(1);
  };

  const animatedNameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nameScale.value }]
  }));

  const animatedEmailStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emailScale.value }]
  }));

  const animatedPassStyle = useAnimatedStyle(() => ({
    transform: [{ scale: passScale.value }]
  }));

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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
  }, [form, register]);

  const navigateToLogin = () => {
    router.back();
  };

  const handleGoogleLogin = async () => {
    try {
      if (!isGoogleSigninAvailable) {
        throw new Error('Google Sign-In is not supported in Expo Go. Please use a development build.');
      }

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
      // EXPO GO DEMO USER BYPASS
      const isExpoGoError = !isGoogleSigninAvailable || 
                            (error.message && (
                              error.message.includes('supported in Expo Go') || 
                              error.message.includes('RNGoogleSignin') ||
                              error.message.includes('native module')
                            ));
                            
      if (isExpoGoError) {
        Alert.alert(
          'התחברות Google',
          'התחברות Google אינה נתמכת בתוך Expo Go ללא build מותאם.\n\nהאם ברצונך להתחבר עם משתמש בדיקה (Demo User) כדי לבדוק את האפליקציה?',
          [
            { text: 'ביטול', style: 'cancel' },
            { 
              text: 'התחבר כמשתמש בדיקה', 
              onPress: async () => {
                console.log('--- Initiating Expo Go Google Demo Bypass (Register) ---');
                // 1. Try logging in with standard demo credentials
                const loginResult = await useAuthStore.getState().login('demo@cinebook.com', '123456');
                if (loginResult.success) {
                  router.replace('/(tabs)');
                } else {
                  // 2. If it fails (first time), register them automatically
                  console.log('Demo user not found, registering automatically...');
                  const registerResult = await useAuthStore.getState().register(
                    'משתמש בדיקה (Demo User)', 
                    'demo@cinebook.com', 
                    '123456'
                  );
                  if (registerResult.success) {
                    router.replace('/(tabs)');
                  } else {
                    Alert.alert('שגיאה', 'לא ניתן היה להתחבר או להירשם כמשתמש בדיקה.');
                  }
                }
              }
            }
          ]
        );
        return;
      }

      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('שגיאת גוגל', 'קרתה שגיאה בתהליך ההתחברות');
      }
    }
  };

  return {
    form,
    setForm,
    isLoading,
    showPassword,
    focusedField,
    animatedNameStyle,
    animatedEmailStyle,
    animatedPassStyle,
    onFocus,
    onBlur,
    togglePasswordVisibility,
    handleRegister,
    navigateToLogin,
    handleGoogleLogin,
  };
};
