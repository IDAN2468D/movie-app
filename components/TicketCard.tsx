import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { API_BASE_URL } from '@/constants/Config';
import { Calendar as CalendarIcon, Mail, CheckCircle2 } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import type { BookedTicket } from '@/store/useBookingStore';
import { Colors } from '@/constants/Theme';
import { addBookingToCalendar } from '@/lib/calendar';
import { useAuthStore } from '@/store/useAuthStore';

interface TicketCardProps {
  ticket: BookedTicket;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { token } = useAuthStore();

  const handleAddToCalendar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addBookingToCalendar({
      title: ticket.movieTitle,
      startDate: ticket.date,
      time: ticket.showtime.time,
      location: `קולנוע סינבוק - ${ticket.showtime.hall}`,
      notes: `מושבים: ${ticket.seats.map(s => `${s.row}${s.number}`).join(', ')}\nמספר הזמנה: ${ticket.id}`,
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
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('שגיאה', 'לא ניתן היה לשלוח את המייל. נסה שוב מאוחר יותר.');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <View className="w-full bg-surface rounded-3xl overflow-hidden mb-6 border border-white/10 shadow-lg">
      <View className="flex-1">
        {/* Top Section - Movie Info */}
        <View className="p-6">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-h2 text-white font-display flex-1 text-right" numberOfLines={1}>
              {ticket.movieTitle}
            </Text>
            <View className="bg-primary/20 px-3 py-1 rounded-full border border-primary/30 ms-3">
              <Text className="text-[10px] font-bold text-primary font-body uppercase">{ticket.showtime.format}</Text>
            </View>
          </View>
          
          <View className="flex-row justify-between">
            <View className="items-start">
              <Text className="text-caption text-textMuted mb-1 font-body">תאריך</Text>
              <Text className="text-body text-white font-bold font-body">{ticket.date}</Text>
            </View>
            <View className="items-start">
              <Text className="text-caption text-textMuted mb-1 font-body">שעה</Text>
              <Text className="text-body text-white font-bold font-body">{ticket.showtime.time}</Text>
            </View>
            <View className="items-start">
              <Text className="text-caption text-textMuted mb-1 font-body">אולם</Text>
              <Text className="text-body text-white font-bold font-body">{ticket.showtime.hall}</Text>
            </View>
          </View>
        </View>

        {/* Perforation Line */}
        <View className="flex-row items-center h-6">
          <View className="w-6 h-6 rounded-full bg-background -ms-3 border-e border-white/5" />
          <View className="flex-1 h-[1px] border-dashed border-white/10 mx-2 border-t-[1px]" />
          <View className="w-6 h-6 rounded-full bg-background -me-3 border-s border-white/5" />
        </View>

        {/* Bottom Section - Seat Info & ID */}
        <View className="p-6">
          <View className="flex-row justify-between items-center mb-6">
            <View className="items-start flex-1">
              <Text className="text-caption text-textMuted mb-1 font-body">מושבים</Text>
              <Text className="text-body text-primary font-black font-body">
                {ticket.seats.map(s => `${s.row}${s.number}`).join(', ')}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-caption text-textMuted mb-1 font-body">קוד הזמנה</Text>
              <Text className="text-caption text-white font-black tracking-widest bg-white/10 px-3 py-1 rounded-lg font-body">
                {ticket.id.substring(0, 8).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 pt-4 border-t border-white/5">
            <Pressable 
              onPress={handleAddToCalendar}
              className="flex-1 flex-row items-center justify-center bg-surfaceLight py-3 rounded-xl border border-white/10"
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <CalendarIcon size={18} color={Colors.text} className="me-2" />
              <Text className="text-label text-text font-bold font-body">הוסף ליומן</Text>
            </Pressable>

            <Pressable 
              onPress={handleSendEmail}
              disabled={sendingEmail || emailSent}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${
                emailSent ? 'bg-green-500/20 border-green-500/30' : 'bg-surfaceLight border-white/10'
              }`}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              {sendingEmail ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : emailSent ? (
                <>
                  <CheckCircle2 size={18} color="#22c55e" className="me-2" />
                  <Text className="text-label text-green-500 font-bold font-body">נשלח!</Text>
                </>
              ) : (
                <>
                  <Mail size={18} color={Colors.text} className="me-2" />
                  <Text className="text-label text-text font-bold font-body">שלח למייל</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

// NativeWind migration complete - styles object removed
