import { useState, useEffect, useRef, useCallback } from 'react';
import { Keyboard, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';

// ── Validation Helpers ──
const luhnCheck = (num: string): boolean => {
  const digits = num.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

export const getCardBrand = (num: string): { brand: string; color: [string, string]; maxLen: number } => {
  const d = num.replace(/\D/g, '');
  if (/^4/.test(d)) return { brand: 'VISA', color: ['#1A1F71', '#1434CB'], maxLen: 16 };
  if (/^5[1-5]/.test(d)) return { brand: 'MASTERCARD', color: ['#EB001B', '#F79E1B'], maxLen: 16 };
  if (/^3[47]/.test(d)) return { brand: 'AMEX', color: ['#006FCF', '#00A1DF'], maxLen: 15 };
  if (/^6(?:011|5)/.test(d)) return { brand: 'DISCOVER', color: ['#FF6000', '#FF9A00'], maxLen: 16 };
  return { brand: 'CARD', color: ['#3B82F6', '#1E3A8A'], maxLen: 16 };
};

const validateExpiry = (exp: string): { valid: boolean; msg: string } => {
  if (!/^\d{2}\/\d{2}$/.test(exp)) return { valid: false, msg: 'פורמט לא תקין (MM/YY)' };
  const [mm, yy] = exp.split('/').map(Number);
  if (mm < 1 || mm > 12) return { valid: false, msg: 'חודש לא תקין' };
  const now = new Date();
  const expDate = new Date(2000 + yy, mm);
  if (expDate <= now) return { valid: false, msg: 'הכרטיס פג תוקף' };
  return { valid: true, msg: '' };
};

export interface FieldError {
  holderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
}

export const usePayment = () => {
  const { user, fetchPaymentMethods, addPaymentMethod, removePaymentMethod } = useAuthStore();

  const [isModalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [newCard, setNewCard] = useState({ cardNumber: '', expiryDate: '', cvv: '', holderName: '' });

  const cardNumberRef = useRef<TextInput>(null);
  const expiryRef = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);

  useEffect(() => { fetchPaymentMethods(); }, []);

  const cardInfo = getCardBrand(newCard.cardNumber);

  const formatCardDisplay = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, cardInfo.maxLen);
    if (cardInfo.brand === 'AMEX') {
      return d.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '));
    }
    return d.replace(/(\d{4})/g, '$1 ').trim();
  };

  const handleCardNumberChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, cardInfo.maxLen);
    setNewCard(prev => ({ ...prev, cardNumber: digits }));
    if (errors.cardNumber) setErrors(prev => ({ ...prev, cardNumber: undefined }));
  };

  const handleExpiryChange = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 4) cleaned = cleaned.slice(0, 4);
    let formatted = cleaned;
    if (cleaned.length >= 2) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    setNewCard(prev => ({ ...prev, expiryDate: formatted }));
    if (errors.expiryDate) setErrors(prev => ({ ...prev, expiryDate: undefined }));
  };

  const handleCvvChange = (text: string) => {
    const maxCvv = cardInfo.brand === 'AMEX' ? 4 : 3;
    const cleaned = text.replace(/\D/g, '').slice(0, maxCvv);
    setNewCard(prev => ({ ...prev, cvv: cleaned }));
    if (errors.cvv) setErrors(prev => ({ ...prev, cvv: undefined }));
  };

  const handleHolderNameChange = (text: string) => {
    setNewCard(prev => ({ ...prev, holderName: text }));
    if (errors.holderName) setErrors(prev => ({ ...prev, holderName: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FieldError = {};
    if (!newCard.holderName.trim() || newCard.holderName.trim().length < 2) newErrors.holderName = 'שם בעל הכרטיס נדרש';
    const digits = newCard.cardNumber.replace(/\D/g, '');
    if (digits.length < 13) newErrors.cardNumber = 'מספר כרטיס קצר מדי';
    else if (!luhnCheck(digits)) newErrors.cardNumber = 'מספר כרטיס לא תקין';
    const expiryResult = validateExpiry(newCard.expiryDate);
    if (!expiryResult.valid) newErrors.expiryDate = expiryResult.msg;
    const minCvv = cardInfo.brand === 'AMEX' ? 4 : 3;
    if (newCard.cvv.length < minCvv) newErrors.cvv = `CVV חייב להיות ${minCvv} ספרות`;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCard = useCallback(async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const result = await addPaymentMethod({
        last4: newCard.cardNumber.slice(-4),
        brand: cardInfo.brand,
        expiryDate: newCard.expiryDate,
        holderName: newCard.holderName.trim(),
      });
      if (result.success) {
        setModalVisible(false);
        setNewCard({ cardNumber: '', expiryDate: '', cvv: '', holderName: '' });
        setErrors({});
        await fetchPaymentMethods();
      } else {
        Alert.alert('שגיאה', result.message || 'נכשל בהוספת כרטיס. נסה שוב.');
      }
    } catch { Alert.alert('שגיאה', 'שגיאת חיבור. בדוק את החיבור לאינטרנט.'); }
    finally { setIsSubmitting(false); }
  }, [newCard, cardInfo, addPaymentMethod, fetchPaymentMethods]);

  const confirmDelete = (id: string) => {
    Alert.alert('מחיקת כרטיס', 'האם אתה בטוח שברצונך למחוק את אמצעי התשלום הזה?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: () => removePaymentMethod(id) },
    ]);
  };

  const openModal = () => {
    setNewCard({ cardNumber: '', expiryDate: '', cvv: '', holderName: '' });
    setErrors({});
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);
  const goBack = () => router.back();

  return {
    user, isModalVisible, isSubmitting, errors, newCard, cardInfo,
    cardNumberRef, expiryRef, cvvRef,
    formatCardDisplay, handleCardNumberChange, handleExpiryChange, handleCvvChange, handleHolderNameChange,
    handleAddCard, confirmDelete, openModal, closeModal, goBack,
  };
};
