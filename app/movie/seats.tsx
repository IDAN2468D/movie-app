import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, I18nManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronRight, ChevronLeft, Ticket, Info, Users } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import SeatMap from '@/components/ZoomableSeatMap';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInRight,
} from 'react-native-reanimated';
import { useSeats } from '@/hooks/useSeats';
import PredictiveSeatSelector from '@/components/PredictiveSeatSelector';
import VipSeatConfiguratorModal from '@/components/VipSeatConfiguratorModal';
import SquadInviteModal from '@/components/SquadInviteModal';
import { useSquadBookingStore } from '@/store/useSquadBookingStore';
import { useVipCustomStore } from '@/store/useVipCustomStore';
import { Seat } from '@/store/useBookingStore';
import { useSeatViewStore } from '@/store/useSeatViewStore';
import SeatViewHUD from '@/components/SeatViewHUD';
import { Eye } from 'lucide-react-native';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

export default function SeatsScreen() {
  const insets = useSafeAreaInsets();
  const {
    selectedMovieTitle,
    selectedMoviePoster,
    selectedShowtime,
    selectedDate,
    selectedSeats,
    totalPrice,
    handleConfirm,
    pulseStyle,
    goBack,
  } = useSeats();

  const { hasCustomization } = useVipCustomStore();
  const [configuratorSeat, setConfiguratorSeat] = useState<Seat | null>(null);

  const [squadModalVisible, setSquadModalVisible] = useState(false);
  const { squadCode, sessionDetails, leaveSquad } = useSquadBookingStore();
  const { fetchSeatMetadata } = useSeatViewStore();

  useEffect(() => {
    return () => {
      leaveSquad();
    };
  }, [leaveSquad]);

  return (
    <View className="flex-1 bg-background">
      {/* Cinematic Background */}
      <View className="absolute inset-0">
        <Image 
          source={{ uri: `${TMDB_IMAGE_BASE_URL}${selectedMoviePoster}` }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <BlurView intensity={100} tint="dark" className="absolute inset-0" />
        <LinearGradient 
          colors={['transparent', 'rgba(0,0,0,0.8)', Colors.background]} 
          className="absolute inset-0" 
        />
      </View>

      {/* Header with better hierarchy */}
      <View 
        className="flex-row items-center px-6 pb-4 pt-2 gap-4 z-20"
        style={{ marginTop: insets.top }}
      >
        <Pressable 
          onPress={goBack} 
          className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 justify-center items-center"
        >
          {I18nManager.isRTL ? <ChevronRight size={24} color="white" /> : <ChevronLeft size={24} color="white" />}
        </Pressable>
        
        <View className="flex-1 items-start">
          <Animated.Text entering={FadeInRight.delay(200)} className="text-h2 text-white font-display text-left leading-tight">
            {selectedMovieTitle}
          </Animated.Text>
          <View className="flex-row items-center gap-2 mt-1">
            <View className="px-2 py-0.5 rounded-md bg-primary/20 border border-primary/30">
              <Text className="text-[10px] text-primary font-bold">{selectedShowtime?.hall}</Text>
            </View>
            <Text className="text-caption text-white/50 font-medium">
              {selectedShowtime?.time} • {selectedDate}
            </Text>
          </View>
        </View>

        {/* SquadSync Button */}
        <Pressable 
          onPress={() => setSquadModalVisible(true)} 
          className={`w-12 h-12 rounded-2xl justify-center items-center border ${
            squadCode 
              ? 'bg-secondary/20 border-secondary' 
              : 'bg-white/10 border-white/20'
          }`}
        >
          <Users size={22} color={squadCode ? Colors.secondary : 'white'} />
        </Pressable>
      </View>

      {/* Active Squad Members list bar */}
      {squadCode && sessionDetails && (
        <Animated.View entering={FadeInRight} className="px-6 pb-2 z-20">
          <BlurView 
            intensity={20} 
            tint="dark" 
            className="flex-row items-center justify-between px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10"
            style={{ flexDirection: 'row-reverse' }}
          >
            <View className="flex-row items-center gap-2" style={{ flexDirection: 'row-reverse' }}>
              <Text className="text-[10px] text-secondary font-bold font-display">קבוצה פעילה: {squadCode}</Text>
              <View className="w-1.5 h-1.5 rounded-full bg-secondary" />
            </View>
            
            <View className="flex-row items-center" style={{ flexDirection: 'row-reverse' }}>
              {sessionDetails.members.map((member, idx) => (
                <View 
                  key={member.userId} 
                  className="w-6 h-6 rounded-full bg-primary/25 border border-primary/45 items-center justify-center"
                  style={{
                    marginRight: idx > 0 ? -6 : 0,
                    zIndex: sessionDetails.members.length - idx
                  }}
                >
                  <Text className="text-[8px] text-primary font-bold">{member.name.substring(0, 1)}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Seat Map Container */}
      <View className="flex-1">
        <Animated.View entering={FadeIn.delay(400)} className="flex-1">
          <SeatMap />
        </Animated.View>
      </View>

      {/* Bottom Interface Layer */}
      <View className="z-30">
        {/* Selected Seats Floating Bar */}
        {selectedSeats.length > 0 && (
          <Animated.View 
            entering={FadeInDown} 
            className="px-6 mb-6"
          >
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-label text-white/70 font-display">מושבים שנבחרו</Text>
              <View className="flex-row items-center gap-1">
                <Info size={12} color="rgba(255,255,255,0.4)" />
                <Text className="text-[10px] text-white/40">לחץ לביטול</Text>
              </View>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingEnd: 20 }}
            >
              {selectedSeats.map((seat, index) => {
                const isVip = seat.type === 'vip';
                const isCustomized = isVip && hasCustomization(seat.row, seat.number);
                return (
                  <Animated.View
                    key={`${seat.row}-${seat.number}`}
                    entering={FadeInRight.delay(index * 100)}
                    style={{ marginEnd: 12 }}
                  >
                    <Pressable
                      onPress={() => isVip ? setConfiguratorSeat(seat) : fetchSeatMetadata(selectedShowtime?.id || 'default_hall', seat.row, seat.number)}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.8 : 1,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      })}
                    >
                      <View
                        style={{
                          borderWidth: 1,
                          borderColor: isVip ? 'rgba(255,20,100,0.5)' : 'rgba(255,255,255,0.2)',
                          backgroundColor: isVip ? 'rgba(255,20,100,0.12)' : 'rgba(255,255,255,0.1)',
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderRadius: 16,
                          alignItems: 'center',
                          minWidth: 72,
                        }}
                      >
                        {/* Eye icon button to directly trigger 3D perspective sightline */}
                        <Pressable 
                          onPress={(e) => {
                            e.stopPropagation();
                            fetchSeatMetadata(selectedShowtime?.id || 'default_hall', seat.row, seat.number);
                          }}
                          className="absolute top-1.5 left-1.5 p-1 rounded-full bg-white/5 border border-white/10 active:bg-white/20"
                          style={{ zIndex: 10 }}
                        >
                          <Eye size={10} color={isVip ? Colors.seatVIP : '#FFFFFF'} />
                        </Pressable>

                        {isVip && (
                          <Text style={{ fontSize: 11, marginBottom: 2, marginTop: 4 }}>
                            {isCustomized ? '⚙️' : '👑'}
                          </Text>
                        )}
                        <Text className="text-h3 text-white font-display mt-2">{seat.row}{seat.number}</Text>
                        <View
                          style={{
                            width: 16, height: 2,
                            backgroundColor: isVip ? Colors.seatVIP : 'rgba(255,20,100,0.4)',
                            borderRadius: 1, marginTop: 4,
                          }}
                        />
                        {isVip ? (
                          <Text style={{ fontSize: 9, color: Colors.seatVIP, fontFamily: 'Assistant', marginTop: 3, fontWeight: '600' }}>
                            {isCustomized ? 'מותאם' : 'הגדר VIP'}
                          </Text>
                        ) : (
                          <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontFamily: 'Assistant', marginTop: 3 }}>
                            תצוגת 3D
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}
        
        {/* Premium Checkout Footer */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <BlurView 
            intensity={90} 
            tint="dark" 
            className="px-6 pt-6 border-t border-white/10 rounded-t-[40px] overflow-hidden"
            style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}
          >
            <View className="flex-row items-center justify-between">
              {/* Enhanced Action Button */}
              <Pressable 
                onPress={handleConfirm}
                disabled={selectedSeats.length === 0}
                className="overflow-hidden rounded-3xl"
                style={({ pressed }) => [
                  { 
                    opacity: selectedSeats.length > 0 ? (pressed ? 0.9 : 1) : 0.4,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
              >
                <Animated.View style={selectedSeats.length > 0 ? pulseStyle : {}}>
                  <LinearGradient
                    colors={selectedSeats.length > 0 ? [Colors.primary, '#D40054'] : ['#27272A', '#18181B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="flex-row items-center gap-3 px-8 py-4 min-w-[160px] justify-center"
                  >
                    <Text className={`font-bold text-h3 font-display ${selectedSeats.length > 0 ? 'text-white' : 'text-white/20'}`}>
                      הזמן עכשיו
                    </Text>
                    <Ticket size={20} color={selectedSeats.length > 0 ? Colors.white : '#52525B'} />
                  </LinearGradient>
                </Animated.View>
              </Pressable>

              {/* Total Price Section */}
              <View className="items-end">
                <Text className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-0.5">סה"כ לתשלום</Text>
                <Text style={{ textAlign: 'right' }}>
                  <Text className="text-h1 text-white font-display">₪{totalPrice.toFixed(0)}</Text>
                  <Text className="text-caption text-primary font-bold">.00</Text>
                </Text>
                <Text className="text-[10px] text-white/30 font-medium text-right">עבור {selectedSeats.length} מושבים</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </View>

      {/* Floating Seating Assistant (Overlay) */}
      <PredictiveSeatSelector />

      {/* VIP Seat Configurator Modal */}
      <VipSeatConfiguratorModal
        visible={configuratorSeat !== null}
        seat={configuratorSeat}
        onClose={() => setConfiguratorSeat(null)}
      />

      {/* SquadSync Invite Modal */}
      <SquadInviteModal
        visible={squadModalVisible}
        onClose={() => setSquadModalVisible(false)}
      />

      {/* CineView 3D Seat View HUD overlay */}
      <SeatViewHUD />
    </View>
  );
}
