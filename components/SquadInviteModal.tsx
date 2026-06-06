import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, Clipboard, Share, ActivityIndicator } from 'react-native';
import { X, Users, Copy, Share2, LogOut, Check } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Theme';
import { useSquadBookingStore } from '@/store/useSquadBookingStore';
import { useBookingStore } from '@/store/useBookingStore';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface SquadInviteModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SquadInviteModal({ visible, onClose }: SquadInviteModalProps) {
  const { 
    squadCode, 
    sessionDetails, 
    isLoading, 
    error, 
    createSquadSession, 
    joinSquadSession, 
    leaveSquad,
    clearError
  } = useSquadBookingStore();

  const { 
    selectedMovieId,
    selectedMovieTitle,
    selectedMoviePoster,
    selectedDate,
    selectedShowtime
  } = useBookingStore();

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [codeInput, setCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!selectedMovieId || !selectedShowtime) return;

    await createSquadSession({
      movieId: selectedMovieId,
      movieTitle: selectedMovieTitle,
      moviePoster: selectedMoviePoster,
      date: selectedDate,
      showtimeId: selectedShowtime.id,
      showtimeTime: selectedShowtime.time,
      showtimeHall: selectedShowtime.hall
    });
  };

  const handleJoin = async () => {
    if (!codeInput.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await joinSquadSession(codeInput);
    if (success) {
      setCodeInput('');
    }
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
    try {
      await Share.share({
        message: `הצטרפו אליי להזמנה קבוצתית בסינבוק (CineBook) לסרט "${selectedMovieTitle}"! הקוד שלי לקבוצה הוא: ${squadCode}. בואו נבחר מושבים ביחד!`,
        title: 'הזמנה קבוצתית SquadSync'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    leaveSquad();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        {/* Semi-transparent Backdrop */}
        <Animated.View 
          entering={FadeIn.duration(250)} 
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 bg-black/70"
        >
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        {/* Sliding Panel */}
        <Animated.View
          entering={SlideInDown.springify().damping(18).mass(0.95)}
          exiting={SlideOutDown.duration(200)}
          className="bg-surfaceLight/95 border-t border-white/10 rounded-t-[36px] overflow-hidden"
          style={{ 
            paddingBottom: 40,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.4,
            shadowRadius: 15,
            elevation: 10
          }}
        >
          <BlurView intensity={30} tint="dark" className="absolute inset-0" />
          
          <View className="absolute inset-0 opacity-10">
            <LinearGradient 
              colors={[Colors.primary, 'transparent']} 
              start={{ x: 0.5, y: 0 }} 
              end={{ x: 0.5, y: 1 }}
              style={{ flex: 1 }}
            />
          </View>

          {/* Drag Handle bar */}
          <View className="w-full items-center pt-4 pb-2 z-10">
            <View className="w-12 h-1 bg-white/20 rounded-full" />
          </View>

          <View className="px-6 pt-2 z-10">
            {/* Header */}
            <View className="flex-row-reverse justify-between items-center mb-6">
              <Text className="text-h2 text-white font-display text-right">הזמנה קבוצתית SquadSync</Text>
              <Pressable 
                onPress={onClose} 
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center"
                hitSlop={12}
              >
                <X color={Colors.text} size={20} />
              </Pressable>
            </View>

            {error && (
              <View className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-5 items-center">
                <Text className="text-caption text-primary text-center font-bold">{error}</Text>
                <Pressable onPress={clearError} className="mt-2 px-3 py-1 bg-primary/20 rounded-lg">
                  <Text className="text-[10px] text-primary font-bold">הבנתי</Text>
                </Pressable>
              </View>
            )}

            {/* Active Squad State */}
            {squadCode ? (
              <View className="items-center">
                <View className="w-16 h-16 bg-secondary/15 rounded-full items-center justify-center mb-4 border border-secondary/20 shadow-md">
                  <Users color={Colors.secondary} size={30} />
                </View>

                <Text className="text-bodyLarge text-white text-center font-bold mb-1">הקבוצה שלך פעילה!</Text>
                <Text className="text-caption text-textSecondary text-center mb-5">שתף את הקוד עם חבריך להצטרפות בזמן אמת</Text>

                {/* Invite Code display card */}
                <View className="bg-black/30 border border-white/5 rounded-3xl p-5 w-full items-center mb-6">
                  <Text className="text-caption text-textSecondary uppercase tracking-widest mb-2">קוד קבוצה</Text>
                  <Text className="text-[36px] text-secondary font-black tracking-[6px] font-display text-center mb-4">
                    {squadCode}
                  </Text>
                  
                  <View className="flex-row gap-4 w-full">
                    <Pressable 
                      onPress={handleCopy}
                      className="flex-1 h-12 bg-white/5 border border-white/10 rounded-2xl flex-row items-center justify-center gap-2"
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      {copied ? <Check color={Colors.secondary} size={18} /> : <Copy color="white" size={18} />}
                      <Text className="text-body text-white font-bold">{copied ? 'הועתק' : 'העתק קוד'}</Text>
                    </Pressable>

                    <Pressable 
                      onPress={handleShare}
                      className="flex-1 h-12 bg-primary rounded-2xl flex-row items-center justify-center gap-2"
                      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                    >
                      <Share2 color="white" size={18} />
                      <Text className="text-body text-white font-bold">שתף קישור</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Members List */}
                <Text className="text-label text-textSecondary text-right w-full mb-3 font-bold">משתתפים בקבוצה ({sessionDetails?.members.length || 0})</Text>
                <View className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 mb-6">
                  {sessionDetails?.members.map((member) => (
                    <View key={member.userId} className="flex-row-reverse items-center justify-between py-2 border-b border-white/5">
                      <View className="flex-row-reverse items-center gap-3">
                        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center border border-primary/30">
                          <Text className="text-caption text-primary font-bold">{member.name.charAt(0)}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-body text-white font-bold">{member.name}</Text>
                          <Text className="text-[10px] text-textSecondary">{member.email}</Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center gap-1.5">
                        <View className={`w-2 h-2 rounded-full ${member.socketId ? 'bg-secondary' : 'bg-white/20'}`} />
                        <Text className="text-[10px] text-textSecondary">
                          {member.socketId ? 'בחיבור' : 'לא מחובר'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Leave Button */}
                <Pressable 
                  onPress={handleLeave}
                  className="w-full h-12 bg-white/5 border border-primary/20 rounded-2xl flex-row items-center justify-center gap-2"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <LogOut color={Colors.primary} size={18} />
                  <Text className="text-body text-primary font-bold">עזוב קבוצה</Text>
                </Pressable>
              </View>
            ) : (
              /* Toggle Tabs (Create vs Join) */
              <View>
                <View className="flex-row-reverse bg-black/20 border border-white/5 rounded-2xl p-1 mb-6">
                  <Pressable 
                    onPress={() => setActiveTab('create')}
                    className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'create' ? 'bg-surfaceLight border border-white/10' : ''}`}
                  >
                    <Text className={`text-label font-bold ${activeTab === 'create' ? 'text-white' : 'text-textSecondary'}`}>צור קבוצה</Text>
                  </Pressable>
                  <Pressable 
                    onPress={() => setActiveTab('join')}
                    className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'join' ? 'bg-surfaceLight border border-white/10' : ''}`}
                  >
                    <Text className={`text-label font-bold ${activeTab === 'join' ? 'text-white' : 'text-textSecondary'}`}>הצטרף לקבוצה</Text>
                  </Pressable>
                </View>

                {activeTab === 'create' ? (
                  /* Create Tab View */
                  <View className="items-center">
                    <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4 border border-primary/20 shadow-md">
                      <Users color={Colors.primary} size={30} />
                    </View>
                    <Text className="text-bodyLarge text-white text-center font-bold mb-2">פתחו סשן בחירה שיתופי בזמן אמת</Text>
                    <Text className="text-body text-textSecondary text-center px-4 mb-8" style={{ lineHeight: 20 }}>
                      תוכלו לבחור מושבים צמודים, לראות את הבחירות של חבריכם בשידור חי על המפה ולשלם בנפרד ללא צורך בהעברת כסף! 🍿
                    </Text>

                    <Pressable 
                      onPress={handleCreate}
                      disabled={isLoading}
                      className="w-full overflow-hidden rounded-2xl shadow-lg shadow-primary/20"
                    >
                      <LinearGradient
                        colors={[Colors.primary, '#9B1B30']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="w-full h-14 items-center justify-center flex-row gap-3"
                      >
                        {isLoading ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <>
                            <Users color="white" size={20} />
                            <Text className="text-white font-bold text-h3 font-display">צור קבוצת סנכרון</Text>
                          </>
                        )}
                      </LinearGradient>
                    </Pressable>
                  </View>
                ) : (
                  /* Join Tab View */
                  <View className="items-center">
                    <View className="w-16 h-16 bg-secondary/15 rounded-full items-center justify-center mb-4 border border-secondary/20 shadow-md">
                      <Users color={Colors.secondary} size={30} />
                    </View>
                    <Text className="text-bodyLarge text-white text-center font-bold mb-2">הזן קוד קבוצה להצטרפות</Text>
                    <Text className="text-caption text-textSecondary text-center px-4 mb-6">הכנס את הקוד בן 6 התווים שקיבלת מהחברים שלך</Text>

                    {/* Numeric/Code Input */}
                    <View className="w-full mb-6">
                      <TextInput
                        value={codeInput}
                        onChangeText={setCodeInput}
                        placeholder="למשל: XA8K2F"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        autoCapitalize="characters"
                        maxLength={6}
                        style={{
                          textAlign: 'center',
                          fontFamily: 'Rubik-Bold',
                          letterSpacing: 4
                        }}
                        className="w-full h-14 bg-black/35 border border-white/10 rounded-2xl text-white text-h2 px-4 focus:border-secondary"
                      />
                    </View>

                    <Pressable 
                      onPress={handleJoin}
                      disabled={isLoading || !codeInput.trim()}
                      className="w-full overflow-hidden rounded-2xl"
                      style={({ pressed }) => ({
                        opacity: codeInput.trim() ? (pressed ? 0.9 : 1) : 0.5
                      })}
                    >
                      <LinearGradient
                        colors={codeInput.trim() ? [Colors.secondary, '#1B9B53'] : ['#27272A', '#18181B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="w-full h-14 items-center justify-center flex-row gap-3"
                      >
                        {isLoading ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <>
                            <Text className={`font-bold text-h3 font-display ${codeInput.trim() ? 'text-background' : 'text-white/20'}`}>התחבר לקבוצה</Text>
                          </>
                        )}
                      </LinearGradient>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
