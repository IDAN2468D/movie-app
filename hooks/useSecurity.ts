import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '@/store/useAuthStore';

export const useSecurity = () => {
  const {
    biometricsEnabled,
    setBiometricsEnabled,
    twoFactorEnabled,
    setTwoFactorEnabled,
  } = useAuthStore();

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [twoFactorModalVisible, setTwoFactorModalVisible] = useState(false);
  const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | 'generic'>('generic');

  useEffect(() => {
    const detectBiometricType = async () => {
      try {
        if (!LocalAuthentication || !LocalAuthentication.supportedAuthenticationTypesAsync) {
          return;
        }
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('face');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('fingerprint');
        } else {
          setBiometricType('generic');
        }
      } catch (err) {
        console.warn('Error fetching supported authentication types:', err);
      }
    };
    detectBiometricType();
  }, []);

  const handleBiometricsToggle = useCallback(async (value: boolean) => {
    const success = await setBiometricsEnabled(value);
    if (!success && value) {
      Alert.alert('שגיאה', 'לא ניתן להפעיל זיהוי ביומטרי. ודא שהמכשיר תומך ומוגדר כראוי.');
    }
  }, [setBiometricsEnabled]);

  const handleTwoFactorToggle = useCallback((value: boolean) => {
    if (value) {
      setTwoFactorModalVisible(true);
    } else {
      setTwoFactorEnabled(false);
    }
  }, [setTwoFactorEnabled]);

  const openPasswordModal = () => setPasswordModalVisible(true);
  const closePasswordModal = () => setPasswordModalVisible(false);
  const closeTwoFactorModal = () => setTwoFactorModalVisible(false);

  const goBack = () => router.back();

  return {
    biometricsEnabled,
    twoFactorEnabled,
    passwordModalVisible,
    twoFactorModalVisible,
    handleBiometricsToggle,
    handleTwoFactorToggle,
    openPasswordModal,
    closePasswordModal,
    closeTwoFactorModal,
    goBack,
    biometricType,
  };
};
