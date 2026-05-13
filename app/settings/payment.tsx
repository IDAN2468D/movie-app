import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, CreditCard, Plus, CheckCircle2, X, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '@/store/useAuthStore';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';

export default function PaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, fetchPaymentMethods, addPaymentMethod, removePaymentMethod } = useAuthStore();
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: '',
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleAddCard = async () => {
    if (!newCard.cardNumber || !newCard.expiryDate || !newCard.cvv || !newCard.holderName) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות');
      return;
    }

    if (newCard.cardNumber.length < 16) {
      Alert.alert('שגיאה', 'מספר כרטיס לא תקין');
      return;
    }

    setIsSubmitting(true);
    const result = await addPaymentMethod({
      last4: newCard.cardNumber.slice(-4),
      brand: 'VISA', // Simulated brand
      expiryDate: newCard.expiryDate,
      holderName: newCard.holderName,
    });

    setIsSubmitting(false);
    if (result.success) {
      setModalVisible(false);
      setNewCard({ cardNumber: '', expiryDate: '', cvv: '', holderName: '' });
      Alert.alert('הצלחה', 'הכרטיס נוסף בהצלחה');
    } else {
      Alert.alert('שגיאה', result.message || 'נכשל בהוספת כרטיס');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      'מחיקת כרטיס',
      'האם אתה בטוח שברצונך למחוק את אמצעי התשלום הזה?',
      [
        { text: 'ביטול', style: 'cancel' },
        { text: 'מחק', style: 'destructive', onPress: () => removePaymentMethod(id) },
      ]
    );
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned.slice(0, 16);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-white/10 relative">
        <Pressable 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full bg-white/5 justify-center items-center z-10"
        >
          <ChevronRight size={24} color={Colors.text} />
        </Pressable>
        <View className="absolute inset-0 justify-center items-center">
          <Text style={[Typography.h2, { fontFamily: 'Rubik-Bold' }]} className="text-white">
            אמצעי תשלום
          </Text>
        </View>
      </View>
      
      <ScrollView className="flex-1 px-5 py-6">
        <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 18, color: 'white', marginBottom: 16 }}>כרטיסים שמורים</Text>

        {user?.paymentMethods && user.paymentMethods.length > 0 ? (
          user.paymentMethods.map((method, index) => (
            <Animated.View 
              key={method.id}
              entering={FadeInDown.delay(index * 100)}
              className="relative w-full h-48 rounded-3xl overflow-hidden p-5 mb-6 shadow-xl"
            >
              <LinearGradient 
                colors={index % 2 === 0 ? ['#3B82F6', '#1E3A8A'] : ['#8B5CF6', '#4C1D95']} 
                className="absolute inset-0" 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
              />
              <View className="flex-row justify-between items-start">
                <CreditCard size={32} color="white" opacity={0.8} />
                <View className="flex-row items-center">
                  <Text style={{ fontFamily: 'Anton-Regular', fontSize: 24, color: 'white', marginRight: 12 }}>{method.brand}</Text>
                  <Pressable onPress={() => confirmDelete(method.id)} className="w-8 h-8 rounded-full bg-black/20 justify-center items-center">
                    <Trash2 size={16} color="white" />
                  </Pressable>
                </View>
              </View>
              
              <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 24, color: 'white', marginTop: 'auto', letterSpacing: 4, textAlign: 'left' }}>
                **** **** **** {method.last4}
              </Text>
              
              <View className="flex-row justify-between items-end mt-4">
                <View>
                  <Text style={{ fontFamily: 'Rubik-Medium', fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'left' }}>שם בעל הכרטיס</Text>
                  <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 16, color: 'white', textAlign: 'left' }}>{method.holderName}</Text>
                </View>
                <View>
                  <Text style={{ fontFamily: 'Rubik-Medium', fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'left' }}>תוקף</Text>
                  <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 16, color: 'white', textAlign: 'left' }}>{method.expiryDate}</Text>
                </View>
              </View>
            </Animated.View>
          ))
        ) : (
          <View className="py-10 items-center justify-center bg-white/5 rounded-3xl border border-white/10 mb-6">
            <CreditCard size={48} color="white" opacity={0.2} />
            <Text style={{ fontFamily: 'Rubik-Medium', color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>אין כרטיסים שמורים</Text>
          </View>
        )}

        <Pressable 
          onPress={() => setModalVisible(true)}
          className="flex-row items-center p-4 bg-white/5 rounded-2xl border border-white/10 overflow-hidden relative border-dashed"
        >
          <View className="w-12 h-12 rounded-xl justify-center items-center bg-white/5 shadow-sm" style={{ marginStart: 4 }}>
            <Plus size={22} color="white" />
          </View>
          <Text style={[Typography.body, { fontFamily: 'Rubik-Medium', fontSize: 16 }]} className="flex-1 text-white ms-4">הוסף כרטיס חדש</Text>
        </Pressable>

        <View className="flex-row items-center mt-10 p-4 bg-primary/10 rounded-2xl border border-primary/20">
          <CheckCircle2 size={24} color={Colors.primary} />
          <Text style={{ fontFamily: 'Rubik-Medium', fontSize: 14, color: 'white', marginStart: 12, flex: 1, lineHeight: 20 }}>
            אמצעי התשלום שלך נשמרים בצורה מאובטחת. אנחנו משתמשים בתקני אבטחה מחמירים.
          </Text>
        </View>
      </ScrollView>

      {/* Add Card Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <Pressable className="absolute inset-0" onPress={() => setModalVisible(false)} />
          
          <Animated.View 
            entering={SlideInDown}
            className="bg-[#1A1A1A] rounded-t-[40px] border-t border-white/10 p-6 pb-12"
          >
            <View className="flex-row justify-between items-center mb-8">
              <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 24, color: 'white' }}>הוספת כרטיס</Text>
              <Pressable onPress={() => setModalVisible(false)} className="w-10 h-10 rounded-full bg-white/5 justify-center items-center">
                <X size={24} color="white" />
              </Pressable>
            </View>

            <View className="space-y-6">
              <View>
                <Text style={{ fontFamily: 'Rubik-Medium', color: 'rgba(255,255,255,0.6)', marginBottom: 8, textAlign: 'right' }}>שם על הכרטיס</Text>
                <TextInput
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-right"
                  placeholder="ישראל ישראלי"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={newCard.holderName}
                  onChangeText={(text) => setNewCard({ ...newCard, holderName: text })}
                  style={{ fontFamily: 'Rubik-Regular' }}
                />
              </View>

              <View>
                <Text style={{ fontFamily: 'Rubik-Medium', color: 'rgba(255,255,255,0.6)', marginBottom: 8, textAlign: 'right' }}>מספר כרטיס</Text>
                <TextInput
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white"
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="numeric"
                  maxLength={16}
                  value={newCard.cardNumber}
                  onChangeText={(text) => setNewCard({ ...newCard, cardNumber: formatCardNumber(text) })}
                  style={{ fontFamily: 'Rubik-Regular', textAlign: 'left' }}
                />
              </View>

              <View className="flex-row" style={{ flexDirection: 'row' }}>
                <View className="flex-1" style={{ marginRight: 12 }}>
                  <Text style={{ fontFamily: 'Rubik-Medium', color: 'rgba(255,255,255,0.6)', marginBottom: 8, textAlign: 'right' }}>CVV</Text>
                  <TextInput
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-center"
                    placeholder="123"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry
                    value={newCard.cvv}
                    onChangeText={(text) => setNewCard({ ...newCard, cvv: text })}
                    style={{ fontFamily: 'Rubik-Regular' }}
                  />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Rubik-Medium', color: 'rgba(255,255,255,0.6)', marginBottom: 8, textAlign: 'right' }}>תוקף (MM/YY)</Text>
                  <TextInput
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-center"
                    placeholder="MM/YY"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    maxLength={5}
                    value={newCard.expiryDate}
                    onChangeText={(text) => setNewCard({ ...newCard, expiryDate: formatExpiry(text) })}
                    style={{ fontFamily: 'Rubik-Regular' }}
                  />
                </View>
              </View>

              <Pressable 
                onPress={handleAddCard}
                disabled={isSubmitting}
                className="mt-8 overflow-hidden rounded-2xl shadow-lg active:opacity-90"
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-4 items-center justify-center flex-row"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <CheckCircle2 size={20} color="white" style={{ marginRight: 8 }} />
                      <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 18, color: 'white' }}>שמור כרטיס</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
