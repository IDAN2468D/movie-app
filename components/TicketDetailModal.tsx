import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, Image, Share } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, QrCode, Download, CreditCard, Share2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BookedTicket } from '@/store/useBookingStore';
import { Colors } from '@/constants/Theme';

interface TicketDetailModalProps {
  ticket: BookedTicket | null;
  isVisible: boolean;
  onClose: () => void;
}

export default function TicketDetailModal({ ticket, isVisible, onClose }: TicketDetailModalProps) {
  const insets = useSafeAreaInsets();

  if (!ticket) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticket.id}&color=${Colors.background.replace('#', '')}&bgcolor=FFFFFF`;

  const handleShare = async () => {
    if (!ticket) return;
    try {
      const seats = ticket.seats?.map(s => `${s.row}${s.number}`).join(', ') || '';
      const message = `🎬 כרטיס לסרט: ${ticket.movieTitle}\n📅 תאריך: ${ticket.date}\n⏰ שעה: ${ticket.showtime?.time}\n📍 אולם: ${ticket.showtime?.hall}\n💺 מושבים: ${seats}\n\nהזמנה מספר: ${ticket.id}\nנתראה ב-CineBook! 🍿`;
      
      await Share.share({
        message,
        title: 'הכרטיס שלי ל-CineBook',
      });
    } catch (error) {
      console.error('Error sharing ticket:', error);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1">
        <BlurView intensity={80} tint="dark" className="flex-1">
          <View 
            className="flex-1 px-6" 
            style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}
          >
            {/* Header - Swapped: X on right, Title on left (in flex-row-reverse) */}
            <View className="flex-row-reverse justify-between items-center mb-8">
              <Pressable 
                onPress={onClose}
                className="w-10 h-10 items-center justify-center bg-white/10 rounded-full border border-white/10"
              >
                <X color="white" size={24} />
              </Pressable>
              <Text className="text-h2 text-white font-display">פרטי הכרטיס</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Ticket Body */}
              <View className="bg-white rounded-[40px] overflow-hidden shadow-2xl">
                {/* Movie Header */}
                <View className="bg-primary p-8 items-center">
                  <Text 
                    className="text-h2 text-white font-display text-center leading-tight mb-2"
                    style={{ writingDirection: 'ltr' }}
                  >
                    {ticket.movieTitle}
                  </Text>
                  <View className="flex-row-reverse items-center opacity-80">
                    <Text className="text-label text-white font-body">{ticket.showtime?.hall || 'אולם'}</Text>
                    <View className="w-1 h-1 rounded-full bg-white mx-2" />
                    <Text className="text-label text-white font-body uppercase">{ticket.showtime?.format || 'רגיל'}</Text>
                  </View>
                </View>

                {/* Main QR Code Section */}
                <View className="p-8 items-center bg-white">
                  <View className="p-6 bg-white border-2 border-black/5 rounded-[32px] shadow-sm">
                    <Image 
                      source={{ uri: qrUrl }}
                      style={{ width: 200, height: 200 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text className="mt-6 text-caption text-background/40 font-mono tracking-[4px] uppercase">
                    ID: {ticket.id.toUpperCase()}
                  </Text>
                </View>

                {/* Perforation Line */}
                <View className="flex-row items-center h-4 overflow-hidden">
                  <View className="w-8 h-8 rounded-full bg-black/5 -ms-4 border border-black/10" />
                  <View className="flex-1 border-dashed border-black/10 mx-1 border-t-2" />
                  <View className="w-8 h-8 rounded-full bg-black/5 -me-4 border border-black/10" />
                </View>

                {/* Ticket Details Grid */}
                <View className="p-8 pt-6">
                  <View className="flex-row-reverse flex-wrap justify-between gap-y-6">
                    <DetailItem label="תאריך" value={ticket.date} />
                    <DetailItem label="שעה" value={ticket.showtime?.time || '--:--'} />
                    <DetailItem label="מושבים" value={ticket.seats?.map(s => `${s.row}${s.number}`).join(', ') || 'N/A'} color={Colors.primary} />
                    <DetailItem label="סוג כרטיס" value="מבוגר (דיגיטלי)" />
                  </View>

                  <View className="h-[1px] bg-black/5 my-8" />

                  {/* Actions */}
                  <View className="gap-4">
                    <Pressable className="flex-row-reverse items-center justify-center bg-black h-14 rounded-2xl gap-3">
                      <CreditCard color="white" size={20} />
                      <Text className="text-label text-white font-bold">Add to Apple Wallet</Text>
                    </Pressable>
                    <Pressable 
                      onPress={handleShare}
                      className="flex-row-reverse items-center justify-center bg-white border border-black/10 h-14 rounded-2xl gap-3 active:bg-black/5"
                    >
                      <Share2 color="black" size={20} />
                      <Text className="text-label text-black font-bold">שתף כרטיס</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Safety Message */}
              <View className="mt-8 items-center opacity-60">
                <Text className="text-caption text-white text-center font-body leading-relaxed">
                  הכרטיס הונפק עבור המשתמש המחובר.{'\n'}
                  יש להציג את קוד ה-QR בכניסה לאולם.
                </Text>
              </View>
            </ScrollView>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

function DetailItem({ label, value, color = '#1A1A1A' }: { label: string; value: string; color?: string }) {
  return (
    <View className="w-[45%] items-start">
      <Text className="text-[10px] text-black/40 mb-1 font-body uppercase tracking-wider">{label}</Text>
      <Text className="text-label font-bold font-body text-right" style={{ color }}>{value}</Text>
    </View>
  );
}
