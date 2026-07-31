import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, Clipboard, Share, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Users, Copy, Share2, LogOut, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { useSquadBookingStore } from '@/store/useSquadBookingStore';
import { useBookingStore } from '@/store/useBookingStore';

interface SquadInviteModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SquadInviteModal({ visible, onClose }: SquadInviteModalProps) {
  const insets = useSafeAreaInsets();
  const { squadCode, sessionDetails, isLoading, error, createSquadSession, joinSquadSession, leaveSquad, clearError } = useSquadBookingStore();
  const { selectedMovieId, selectedMovieTitle, selectedMoviePoster, selectedDate, selectedShowtime } = useBookingStore();

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [codeInput, setCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await createSquadSession({
      movieId: selectedMovieId || 550,
      movieTitle: selectedMovieTitle || 'מיניונים ומפלצות',
      moviePoster: selectedMoviePoster || '',
      date: selectedDate || 'היום, 17:30',
      showtimeId: selectedShowtime?.id || 'st-1',
      showtimeTime: selectedShowtime?.time || '17:30',
      showtimeHall: selectedShowtime?.hall || 'אולם IMAX 1'
    });
  };

  const handleJoin = async () => {
    if (!codeInput.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await joinSquadSession(codeInput);
    if (success) setCodeInput('');
  };

  const handleCopy = () => {
    if (!squadCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Clipboard.setString(squadCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!squadCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Share.share({
      message: `הצטרפו אליי להזמנה קבוצתית בסינבוק (CineBook) לסרט "${selectedMovieTitle || 'מיניונים ומפלצות'}"! הקוד שלי: ${squadCode}.`,
      title: 'הזמנה קבוצתית'
    });
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <Pressable className="absolute inset-0 bg-black/80" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }} />

        {/* Bottom Sheet with Safe Area Bottom Padding */}
        <View
          className="bg-[#141318] border-t border-white/10 rounded-t-[36px] px-6 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom + 20, 32) }}
        >
          {/* Drag Handle */}
          <View className="w-full items-center pb-3">
            <View className="w-10 h-1 bg-white/20 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X color={Colors.text} size={18} />
            </Pressable>
            <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-xl text-white font-bold">הזמנה קבוצתית</Text>
          </View>

          {error && (
            <View className="bg-primary/10 border border-primary/30 rounded-2xl p-3 mb-4 items-center">
              <Text className="text-xs text-primary font-bold">{error}</Text>
              <Pressable onPress={clearError} className="mt-1 px-3 py-1 bg-primary/20 rounded-lg">
                <Text className="text-[10px] text-primary font-bold">אישור</Text>
              </Pressable>
            </View>
          )}

          {squadCode ? (
            /* Active Squad View */
            <View className="items-center">
              <View className="w-14 h-14 bg-secondary/15 rounded-full items-center justify-center mb-3 border border-secondary/20">
                <Users color={Colors.secondary} size={26} />
              </View>
              <Text className="text-lg text-white font-bold mb-1">הקבוצה שלך פעילה!</Text>
              <Text style={{ textAlign: 'center', writingDirection: 'rtl' }} className="text-xs text-white/50 mb-4">שתף את הקוד עם חבריך להצטרפות בזמן אמת</Text>

              <View className="bg-black/50 border border-white/10 rounded-3xl p-4 w-full items-center mb-5">
                <Text className="text-[11px] text-white/40 uppercase tracking-widest mb-1">קוד קבוצה</Text>
                <Text className="text-3xl text-secondary font-black tracking-[6px] text-center mb-3">{squadCode}</Text>
                <View className="flex-row gap-3 w-full">
                  <Pressable onPress={handleCopy} className="flex-1 h-11 bg-white/10 border border-white/15 rounded-xl flex-row items-center justify-center gap-2">
                    {copied ? <Check color={Colors.secondary} size={16} /> : <Copy color="white" size={16} />}
                    <Text className="text-xs text-white font-bold">{copied ? 'הועתק' : 'העתק קוד'}</Text>
                  </Pressable>
                  <Pressable onPress={handleShare} className="flex-1 h-11 bg-primary rounded-xl flex-row items-center justify-center gap-2">
                    <Share2 color="white" size={16} />
                    <Text className="text-xs text-white font-bold">שתף קישור</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); leaveSquad(); }} className="w-full h-11 bg-white/5 border border-primary/20 rounded-xl flex-row items-center justify-center gap-2">
                <LogOut color={Colors.primary} size={16} />
                <Text className="text-xs text-primary font-bold">עזוב קבוצה</Text>
              </Pressable>
            </View>
          ) : (
            /* Tab Selector & Forms */
            <View>
              <View className="flex-row-reverse bg-black/40 border border-white/10 rounded-2xl p-1 mb-5">
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('create'); }}
                  className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'create' ? 'bg-white/10 border border-white/15' : ''}`}
                >
                  <Text className={`text-xs font-bold ${activeTab === 'create' ? 'text-white' : 'text-white/40'}`}>צור קבוצה</Text>
                </Pressable>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('join'); }}
                  className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'join' ? 'bg-white/10 border border-white/15' : ''}`}
                >
                  <Text className={`text-xs font-bold ${activeTab === 'join' ? 'text-white' : 'text-white/40'}`}>הצטרף לקבוצה</Text>
                </Pressable>
              </View>

              {activeTab === 'create' ? (
                <View className="items-center">
                  <View className="w-14 h-14 bg-primary/10 rounded-full items-center justify-center mb-3 border border-primary/20">
                    <Users color={Colors.primary} size={26} />
                  </View>
                  <Text style={{ textAlign: 'center', writingDirection: 'rtl' }} className="text-base text-white font-bold mb-1">פתחו סשן בחירה שיתופי בזמן אמת</Text>
                  <Text style={{ textAlign: 'center', writingDirection: 'rtl', lineHeight: 18 }} className="text-xs text-white/50 px-2 mb-6">
                    תוכלו לבחור מושבים צמודים, לראות את הבחירות של חבריכם בשידור חי על המפה ולשלם בנפרד! 🍿
                  </Text>

                  <Pressable onPress={handleCreate} disabled={isLoading} className="w-full rounded-2xl overflow-hidden shadow-lg shadow-primary/20">
                    <LinearGradient colors={[Colors.primary, '#9B1B30']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="w-full h-12 items-center justify-center flex-row gap-2">
                      {isLoading ? <ActivityIndicator color="white" /> : (
                        <>
                          <Users color="white" size={18} />
                          <Text className="text-white font-bold text-sm">צור קבוצת סנכרון</Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                </View>
              ) : (
                <View className="items-center">
                  <View className="w-14 h-14 bg-secondary/15 rounded-full items-center justify-center mb-3 border border-secondary/20">
                    <Users color={Colors.secondary} size={26} />
                  </View>
                  <Text style={{ textAlign: 'center', writingDirection: 'rtl' }} className="text-base text-white font-bold mb-1">הזן קוד קבוצה להצטרפות</Text>
                  <Text style={{ textAlign: 'center', writingDirection: 'rtl' }} className="text-xs text-white/50 mb-4">הכנס את הקוד בן 6 התווים שקיבלת מהחברים</Text>

                  <TextInput
                    value={codeInput}
                    onChangeText={setCodeInput}
                    placeholder="SQD742"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    autoCapitalize="characters"
                    maxLength={6}
                    style={{ textAlign: 'center', letterSpacing: 4 }}
                    className="w-full h-12 bg-black/50 border border-white/15 rounded-xl text-white font-bold text-lg mb-5"
                  />

                  <Pressable onPress={handleJoin} disabled={isLoading || !codeInput.trim()} className="w-full rounded-2xl overflow-hidden" style={{ opacity: codeInput.trim() ? 1 : 0.4 }}>
                    <LinearGradient colors={codeInput.trim() ? [Colors.secondary, '#1B9B53'] : ['#27272A', '#18181B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="w-full h-12 items-center justify-center flex-row gap-2">
                      {isLoading ? <ActivityIndicator color="white" /> : (
                        <Text className={`font-bold text-sm ${codeInput.trim() ? 'text-background' : 'text-white/40'}`}>התחבר לקבוצה</Text>
                      )}
                    </LinearGradient>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
