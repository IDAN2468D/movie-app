import { View, Text, Pressable, Alert, ActivityIndicator, Image } from 'react-native';
import { useState } from 'react';
import { API_BASE_URL } from '@/constants/Config';
import { Calendar as CalendarIcon, Mail, CheckCircle2, QrCode, ArrowRightLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

import type { BookedTicket } from '@/store/useBookingStore';
import { Colors } from '@/constants/Theme';
import { addBookingToCalendar } from '@/lib/calendar';
import { useAuthStore } from '@/store/useAuthStore';

interface TicketCardProps {
  ticket: BookedTicket;
  onPress?: () => void;
}

export default function TicketCard({ ticket, onPress }: TicketCardProps) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { token } = useAuthStore();

  const handleAddToCalendar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addBookingToCalendar({
      title: ticket.movieTitle || 'סרט ללא שם',
      startDate: ticket.date,
      time: ticket.showtime?.time || '--:--',
      location: `קולנוע סינבוק - ${ticket.showtime?.hall || 'אולם ראשי'}`,
      notes: `מושבים: ${ticket.seats?.map(s => `${s.row}${s.number}`).join(', ') || 'לא נבחרו'}\nמספר הזמנה: ${ticket.id}`,
    });
  };

  const handleSendEmail = async () => {
    if (emailSent) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSendingEmail(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticket.id}/email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setEmailSent(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('נשלח!', 'הכרטיס נשלח לכתובת המייל שלך בהצלחה.');
      } else {
        throw new Error(result.message || 'שגיאת שרת');
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      Alert.alert('שגיאה בשליחה', error.message || 'לא ניתן היה לשלוח את המייל. נסה שוב מאוחר יותר.');
    } finally {
      setSendingEmail(false);
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket.id}&color=${Colors.primary.replace('#', '')}&bgcolor=FFFFFF`;

  return (
    <Pressable 
      testID={`ticket-card-${ticket.id}`}
      onPress={onPress}
    >
      <BlurView intensity={20} tint="dark" className="rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
        <View>
          {/* Top Section - Movie Info */}
          <View className="p-5">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text 
                  className="text-h2 text-white font-display text-left leading-tight" 
                  numberOfLines={2}
                  style={{ writingDirection: 'ltr' }}
                >
                  {ticket.movieTitle || 'סרט ללא שם'}
                </Text>
                <View className="flex-row items-center mt-2 opacity-60">
                  <Text className="text-caption text-white font-body">{ticket.showtime?.hall || 'אולם'}</Text>
                  <View className="w-1 h-1 rounded-full bg-white mx-2" />
                  <Text className="text-caption text-white font-body uppercase">{ticket.showtime?.format || 'רגיל'}</Text>
                </View>
              </View>
              
              <View className="bg-white p-2 rounded-2xl shadow-lg shadow-primary/50 overflow-hidden">
                <Image 
                  source={{ uri: qrUrl }}
                  style={{ width: 48, height: 48 }}
                  resizeMode="contain"
                />
              </View>
            </View>
            
            <View className="flex-row justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
              <View className="items-center px-2">
                <Text className="text-[10px] text-white/40 mb-1 font-body uppercase tracking-wider">תאריך</Text>
                <Text className="text-label text-white font-bold font-body">{ticket.date}</Text>
              </View>
              <View className="w-[1px] h-8 bg-white/10" />
              <View className="items-center px-2">
                <Text className="text-[10px] text-white/40 mb-1 font-body uppercase tracking-wider">שעה</Text>
                <Text className="text-label text-white font-bold font-body">{ticket.showtime?.time || '--:--'}</Text>
              </View>
              <View className="w-[1px] h-8 bg-white/10" />
              <View className="items-center px-2">
                <Text className="text-[10px] text-white/40 mb-1 font-body uppercase tracking-wider">מושבים</Text>
                <Text className="text-label text-primary font-black font-body">
                  {ticket.seats && ticket.seats.length > 2 ? `${ticket.seats.length} מקומות` : ticket.seats?.map(s => `${s.row}${s.number}`).join(', ') || 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Cinematic Perforation */}
          <View className="flex-row items-center h-8">
            <View className="w-8 h-8 rounded-full bg-background -ms-4 border-e border-white/10" />
            <View className="flex-1 border-dashed border-white/20 mx-1 border-t-[1px]" />
            <View className="w-8 h-8 rounded-full bg-background -me-4 border-s border-white/10" />
          </View>

          {/* Bottom Section - Quick Actions */}
          <View className="px-5 pb-5 pt-2">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-[10px] text-white/40 mb-1 font-body uppercase tracking-wider text-right">קוד הזמנה</Text>
                <Text className="text-label text-white font-mono font-bold tracking-[2px]">
                  {ticket.id ? ticket.id.substring(0, 8).toUpperCase() : '--------'}
                </Text>
              </View>
              <View className="flex-row gap-3">
                <Pressable 
                  onPress={handleAddToCalendar}
                  className="w-12 h-12 items-center justify-center bg-white/5 rounded-2xl border border-white/10"
                >
                  <CalendarIcon size={20} color={Colors.text} />
                </Pressable>
                <Pressable 
                  onPress={handleSendEmail}
                  disabled={sendingEmail || emailSent}
                  className={`w-12 h-12 items-center justify-center rounded-2xl border ${
                    emailSent ? 'bg-green-500/20 border-green-500/30' : 'bg-white/5 border-white/10'
                  }`}
                >
                  {sendingEmail ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : emailSent ? (
                    <CheckCircle2 size={20} color="#22c55e" />
                  ) : (
                    <Mail size={20} color={Colors.text} />
                  )}
                </Pressable>
              </View>
            </View>
            
            <View className="bg-primary/10 py-4 rounded-2xl items-center border border-primary/20">
              <Text className="text-label text-primary font-bold font-body">לחץ להצגת הכרטיס המלא</Text>
            </View>
          </View>
        </View>
      </BlurView>
    </Pressable>
  );
}

// NativeWind migration complete - styles object removed
