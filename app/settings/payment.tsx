import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Modal, TextInput, Alert, ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, CreditCard, Plus, CheckCircle2, X, Trash2, Shield, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/useAuthStore';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

// ── Validation Helpers ──
const luhnCheck = (num: string): boolean => {
  const digits = num.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

const getCardBrand = (num: string): { brand: string; color: [string, string]; maxLen: number } => {
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

interface FieldError {
  holderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
}

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
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

  // ── Formatters ──
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
    if (cleaned.length >= 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    setNewCard(prev => ({ ...prev, expiryDate: formatted }));
    if (errors.expiryDate) setErrors(prev => ({ ...prev, expiryDate: undefined }));
  };

  const handleCvvChange = (text: string) => {
    const maxCvv = cardInfo.brand === 'AMEX' ? 4 : 3;
    const cleaned = text.replace(/\D/g, '').slice(0, maxCvv);
    setNewCard(prev => ({ ...prev, cvv: cleaned }));
    if (errors.cvv) setErrors(prev => ({ ...prev, cvv: undefined }));
  };

  // ── Validation ──
  const validateForm = (): boolean => {
    const newErrors: FieldError = {};
    if (!newCard.holderName.trim() || newCard.holderName.trim().length < 2) {
      newErrors.holderName = 'שם בעל הכרטיס נדרש';
    }
    const digits = newCard.cardNumber.replace(/\D/g, '');
    if (digits.length < 13) {
      newErrors.cardNumber = 'מספר כרטיס קצר מדי';
    } else if (!luhnCheck(digits)) {
      newErrors.cardNumber = 'מספר כרטיס לא תקין';
    }
    const expiryResult = validateExpiry(newCard.expiryDate);
    if (!expiryResult.valid) {
      newErrors.expiryDate = expiryResult.msg;
    }
    const minCvv = cardInfo.brand === 'AMEX' ? 4 : 3;
    if (newCard.cvv.length < minCvv) {
      newErrors.cvv = `CVV חייב להיות ${minCvv} ספרות`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ──
  const handleAddCard = async () => {
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
        // Refetch to ensure sync
        await fetchPaymentMethods();
      } else {
        Alert.alert('שגיאה', result.message || 'נכשל בהוספת כרטיס. נסה שוב.');
      }
    } catch (e) {
      Alert.alert('שגיאה', 'שגיאת חיבור. בדוק את החיבור לאינטרנט.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // ── Render ──
  const renderInput = (
    label: string,
    value: string,
    onChange: (t: string) => void,
    error?: string,
    props?: any,
    ref?: any,
  ) => (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontFamily: 'Rubik-Medium', color: error ? '#FF6B6B' : 'rgba(255,255,255,0.55)', marginBottom: 8, fontSize: 13, textAlign: 'left' }}>
        {label}
      </Text>
      <View style={{ borderWidth: 1.5, borderColor: error ? '#FF6B6B' : 'rgba(255,255,255,0.08)', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChange}
          placeholderTextColor="rgba(255,255,255,0.2)"
          style={{ fontFamily: 'Rubik-Regular', color: 'white', padding: 16, fontSize: 16, textAlign: props?.textAlign || 'right' }}
          {...props}
        />
      </View>
      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, justifyContent: 'flex-start' }}>
          <AlertCircle size={12} color="#FF6B6B" />
          <Text style={{ fontFamily: 'Rubik-Regular', color: '#FF6B6B', fontSize: 12, marginStart: 4 }}>{error}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-white/10 relative">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 justify-center items-center z-10">
          <ChevronRight size={24} color={Colors.text} />
        </Pressable>
        <View className="absolute inset-0 justify-center items-center">
          <Text style={[Typography.h2, { fontFamily: 'Rubik-Bold' }]} className="text-white">אמצעי תשלום</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 18, color: 'white', marginBottom: 16, textAlign: 'left' }}>כרטיסים שמורים</Text>

        {user?.paymentMethods && user.paymentMethods.length > 0 ? (
          user.paymentMethods.map((method, index) => {
            const brandColors = getCardBrand(method.last4).color;
            return (
              <Animated.View key={method.id} entering={FadeInDown.delay(index * 120)} style={{ marginBottom: 20 }}>
                <View style={{ width: '100%', height: 200, borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: brandColors[0], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 }}>
                  <LinearGradient colors={index % 2 === 0 ? ['#3B82F6', '#1E3A8A'] : ['#8B5CF6', '#4C1D95']} style={{ flex: 1, padding: 20 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    {/* Top Row */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <CreditCard size={28} color="white" style={{ opacity: 0.7 }} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 20, color: 'white', letterSpacing: 1 }}>{method.brand}</Text>
                        <Pressable onPress={() => confirmDelete(method.id)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                          <Trash2 size={14} color="white" />
                        </Pressable>
                      </View>
                    </View>

                    {/* Card Number */}
                    <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 22, color: 'white', marginTop: 'auto', letterSpacing: 4, textAlign: 'left' }}>
                      •••• •••• •••• {method.last4}
                    </Text>

                    {/* Bottom Row */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
                      <View>
                        <Text style={{ fontFamily: 'Rubik-Regular', fontSize: 10, color: 'rgba(255,255,255,0.6)', textAlign: 'left' }}>CARD HOLDER</Text>
                        <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 14, color: 'white', textAlign: 'left' }}>{method.holderName}</Text>
                      </View>
                      <View>
                        <Text style={{ fontFamily: 'Rubik-Regular', fontSize: 10, color: 'rgba(255,255,255,0.6)', textAlign: 'left' }}>EXPIRES</Text>
                        <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 14, color: 'white', textAlign: 'left' }}>{method.expiryDate}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>
            );
          })
        ) : (
          <Animated.View entering={FadeIn.duration(600)} style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 24 }}>
            <CreditCard size={52} color="white" style={{ opacity: 0.15 }} />
            <Text style={{ fontFamily: 'Rubik-Medium', color: 'rgba(255,255,255,0.4)', marginTop: 14, fontSize: 15 }}>אין כרטיסים שמורים</Text>
            <Text style={{ fontFamily: 'Rubik-Regular', color: 'rgba(255,255,255,0.25)', marginTop: 4, fontSize: 12 }}>הוסף כרטיס אשראי כדי לרכוש כרטיסים</Text>
          </Animated.View>
        )}

        {/* Add Card Button */}
        <Pressable onPress={openModal} style={({ pressed }) => [{ alignItems: 'center', padding: 24, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)', opacity: pressed ? 0.7 : 1 }]}>
          <Text style={{ fontFamily: 'Rubik-Medium', fontSize: 17, color: 'white', marginBottom: 16 }}>הוסף כרטיס חדש</Text>
          <View style={{ width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <Plus size={26} color={Colors.primary} />
          </View>
        </Pressable>

        {/* Security Note */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 32, padding: 16, backgroundColor: 'rgba(79,209,130,0.08)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(79,209,130,0.15)' }}>
          <Text style={{ fontFamily: 'Rubik-Medium', fontSize: 13, color: 'rgba(255,255,255,0.8)', marginEnd: 12, flex: 1, lineHeight: 20, textAlign: 'left' }}>
            אמצעי התשלום שלך מוגנים בהצפנה מקצה לקצה. אנחנו לא שומרים את מספר הכרטיס המלא.
          </Text>
          <Shield size={22} color="#4FD182" />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Add Card Modal ── */}
      <Modal visible={isModalVisible} transparent animationType="none" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }} onPress={() => setModalVisible(false)}>

            <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: '#141414', borderTopLeftRadius: 36, borderTopRightRadius: 36, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 20 }}>

              {/* Handle bar */}
              <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 22, color: 'white', textAlign: 'left' }}>הוספת כרטיס חדש</Text>
                <Pressable onPress={() => setModalVisible(false)} hitSlop={12} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' }}>
                  <X size={22} color="white" />
                </Pressable>
              </View>

              {/* Live Card Preview */}
              <Animated.View entering={FadeIn.duration(400)} style={{ marginBottom: 24 }}>
                <View style={{ height: 110, borderRadius: 20, overflow: 'hidden' }}>
                  <LinearGradient colors={newCard.cardNumber.length > 0 ? cardInfo.color : ['#2A2A2A', '#1A1A1A']} style={{ flex: 1, padding: 16, justifyContent: 'space-between' }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <CreditCard size={20} color="white" style={{ opacity: 0.5 }} />
                      <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 14, color: 'white', opacity: 0.8, letterSpacing: 1 }}>{cardInfo.brand}</Text>
                    </View>
                    <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 18, color: 'white', letterSpacing: 3, textAlign: 'left' }}>
                      {newCard.cardNumber ? formatCardDisplay(newCard.cardNumber) : '•••• •••• •••• ••••'}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontFamily: 'Rubik-Medium', fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'left' }}>
                        {newCard.holderName || 'שם בעל הכרטיס'}
                      </Text>
                      <Text style={{ fontFamily: 'Rubik-Medium', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                        {newCard.expiryDate || 'MM/YY'}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>

              {/* Form Fields */}
              {renderInput('שם בעל הכרטיס', newCard.holderName, (t) => {
                setNewCard(prev => ({ ...prev, holderName: t }));
                if (errors.holderName) setErrors(prev => ({ ...prev, holderName: undefined }));
              }, errors.holderName, { placeholder: 'ישראל ישראלי', returnKeyType: 'next', onSubmitEditing: () => cardNumberRef.current?.focus() })}

              {renderInput('מספר כרטיס', formatCardDisplay(newCard.cardNumber), handleCardNumberChange, errors.cardNumber, { placeholder: '0000 0000 0000 0000', keyboardType: 'numeric', maxLength: cardInfo.maxLen + 3, returnKeyType: 'next', onSubmitEditing: () => expiryRef.current?.focus() }, cardNumberRef)}

              {/* Expiry + CVV Row */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  {renderInput('תוקף', newCard.expiryDate, handleExpiryChange, errors.expiryDate, { placeholder: 'MM/YY', keyboardType: 'numeric', maxLength: 5, textAlign: 'center', returnKeyType: 'next', onSubmitEditing: () => cvvRef.current?.focus() }, expiryRef)}
                </View>
                <View style={{ flex: 1 }}>
                  {renderInput('CVV', newCard.cvv, handleCvvChange, errors.cvv, { placeholder: cardInfo.brand === 'AMEX' ? '0000' : '000', keyboardType: 'numeric', maxLength: cardInfo.brand === 'AMEX' ? 4 : 3, secureTextEntry: true, textAlign: 'center', returnKeyType: 'done', onSubmitEditing: handleAddCard }, cvvRef)}
                </View>
              </View>

              {/* Submit Button */}
              <Pressable onPress={handleAddCard} disabled={isSubmitting} style={({ pressed }) => [{ marginTop: 8, borderRadius: 18, overflow: 'hidden', opacity: pressed ? 0.85 : isSubmitting ? 0.6 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <CheckCircle2 size={20} color="white" style={{ marginEnd: 8 }} />
                      <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 17, color: 'white' }}>שמור כרטיס</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
