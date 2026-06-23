import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gavel, RefreshCw, X, Award, Info, CornerDownLeft } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { io } from 'socket.io-client';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';

interface IAuction {
  _id: string;
  originalSeat: string;
  targetSeat?: string;
  highestBid: number;
  pointsRequired: number;
  ownerId?: {
    name: string;
  };
  expiresAt: string;
}

export default function CineSeatAuctionScreen() {
  const insets = useSafeAreaInsets();
  const [auctions, setAuctions] = useState<IAuction[]>([]);
  const [loading, setLoading] = useState(false);
  const [bidValue, setBidValue] = useState('');
  const [selectedAuction, setSelectedAuction] = useState<IAuction | null>(null);
  const [socket, setSocket] = useState<any>(null);

  // Initialize WebSockets and Fetch initial auctions
  useEffect(() => {
    const socketInstance = io('http://localhost:5000');
    setSocket(socketInstance);

    socketInstance.emit('join_auction', { showtimeId: 'showtime-101' });

    socketInstance.on('initial_auctions', (data: IAuction[]) => {
      setAuctions(data);
    });

    socketInstance.on('bid_updated', ({ auctionId, highestBid }: { auctionId: string, highestBid: number }) => {
      setAuctions(prev =>
        prev.map(auc => (auc._id === auctionId ? { ...auc, highestBid } : auc))
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    });

    socketInstance.on('swap_confirmed', ({ auctionId }: { auctionId: string }) => {
      setAuctions(prev => prev.filter(auc => auc._id !== auctionId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('החלפה הושלמה', 'המושב הוחלף בהצלחה עם משתמש אחר!');
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const fetchActiveAuctions = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/mcp/seatauction/active/showtime-101', {
        headers: { 'Authorization': 'Bearer mock-dev-token' }
      });
      const json = await response.json();
      if (json.success) {
        setAuctions(json.data);
      }
    } catch (err) {
      console.warn('SeatAuction fetch offline simulation:', err);
      // Fallback mocks
      setAuctions([
        { _id: 'auc-1', originalSeat: 'H-12', highestBid: 80, pointsRequired: 50, ownerId: { name: 'יוני' }, expiresAt: new Date(Date.now() + 3600000).toISOString() },
        { _id: 'auc-2', originalSeat: 'G-14', targetSeat: 'F-14', highestBid: 0, pointsRequired: 30, ownerId: { name: 'שירה' }, expiresAt: new Date(Date.now() + 1800000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveAuctions();
  }, []);

  const handlePlaceBid = async () => {
    if (!selectedAuction || !bidValue) return;
    const pointsBid = parseInt(bidValue, 10);
    if (isNaN(pointsBid) || pointsBid <= selectedAuction.highestBid) {
      Alert.alert('שגיאה', 'הצעת המחיר חייבת להיות גבוהה מההצעה הנוכחית');
      return;
    }

    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      const response = await fetch('http://localhost:5000/api/mcp/seatauction/bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-dev-token'
        },
        body: JSON.stringify({
          auctionId: selectedAuction._id,
          pointsBid
        })
      });

      const json = await response.json();
      if (json.success) {
        // Emit socket bid change to notify other users
        if (socket) {
          socket.emit('new_bid_placed', {
            showtimeId: 'showtime-101',
            auctionId: selectedAuction._id,
            highestBid: pointsBid,
            highestBidderName: 'אני'
          });
        }
        Alert.alert('ההצעה נקלטה', 'הצעתם בהצלחה נקודות על המושב!');
        setBidValue('');
        setSelectedAuction(null);
        fetchActiveAuctions();
      } else {
        Alert.alert('שגיאה', json.message || 'לא ניתן להציע הצעה');
      }
    } catch (err) {
      console.warn('Bid online error, simulating bid offline:', err);
      // Simulate locally
      if (socket) {
        socket.emit('new_bid_placed', {
          showtimeId: 'showtime-101',
          auctionId: selectedAuction._id,
          highestBid: pointsBid,
          highestBidderName: 'אני'
        });
      }
      setAuctions(prev =>
        prev.map(auc => (auc._id === selectedAuction._id ? { ...auc, highestBid: pointsBid } : auc))
      );
      setSelectedAuction(null);
      setBidValue('');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMockListing = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await fetch('http://localhost:5000/api/mcp/seatauction/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-dev-token'
        },
        body: JSON.stringify({
          showtimeId: 'showtime-101',
          originalSeat: 'B-14',
          targetSeat: 'A-12',
          pointsRequired: 40
        })
      });
      fetchActiveAuctions();
    } catch (e) {
      // Offline local append
      setAuctions(prev => [
        ...prev,
        { _id: `auc-${Math.random()}`, originalSeat: 'B-14', targetSeat: 'A-12', highestBid: 0, pointsRequired: 40, ownerId: { name: 'אני' }, expiresAt: new Date(Date.now() + 3600000).toISOString() }
      ]);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }} className="flex-1 px-6">
        
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <Pressable onPress={() => router.back()} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <X size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-display">CineSeat Swap & Auction</Text>
          <Pressable onPress={fetchActiveAuctions} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <RefreshCw size={18} color="white" />
          </Pressable>
        </View>

        {/* Info Card */}
        <View className="bg-white/5 border border-white/10 p-4 rounded-3xl mb-6 flex-row justify-end items-center gap-3">
          <View className="flex-1 items-end">
            <Text className="text-white text-sm font-bold">שוק החלפת מושבים P2P</Text>
            <Text style={{ textAlign: 'right' }} className="text-white/40 text-[11px] mt-0.5">הציעו את המושב שלכם תמורת מושב אחר או הציעו נקודות CinePass על מושבים מבוקשים כעת</Text>
          </View>
          <View className="w-10 h-10 rounded-2xl bg-secondary/10 border border-secondary/30 items-center justify-center">
            <Info size={18} color={Colors.secondary} />
          </View>
        </View>

        {/* Active Auctions List */}
        <Text style={{ textAlign: 'right' }} className="text-white text-base font-bold mb-4">מושבים פנויים להחלפה או ביד</Text>

        {loading && auctions.length === 0 ? (
          <ActivityIndicator size="large" color={Colors.primary} className="my-8" />
        ) : auctions.length === 0 ? (
          <View className="bg-surfaceLight rounded-3xl p-8 items-center border border-white/5">
            <Text className="text-white/40 text-sm font-semibold">אין מושבים זמינים להחלפה כרגע</Text>
            <Pressable onPress={handleCreateMockListing} className="mt-4 bg-primary/20 border border-primary/30 px-4 py-2 rounded-xl">
              <Text className="text-primary text-xs font-bold">הוסף מושב משלך להחלפה</Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-4">
            {auctions.map((auc) => (
              <Animated.View key={auc._id} entering={FadeInDown.duration(600).springify()} className="bg-surfaceLight border border-white/10 rounded-3xl p-5 relative overflow-hidden">
                <LinearGradient colors={['rgba(255, 255, 255, 0.02)', 'transparent']} style={StyleSheet.absoluteFill} />
                
                <View className="flex-row justify-between items-center mb-3">
                  {/* Bids info */}
                  <View className="flex-row items-center gap-1 bg-secondary/10 border border-secondary/30 px-3 py-1 rounded-full">
                    <Award size={12} color={Colors.secondary} />
                    <Text className="text-secondary text-[11px] font-bold">
                      {auc.highestBid > 0 ? `${auc.highestBid} נקודות` : `${auc.pointsRequired} נקודות התחלה`}
                    </Text>
                  </View>
                  
                  {/* Seat code */}
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-white/40 text-xs">שייך ל-{auc.ownerId?.name || 'חבר'}</Text>
                    <Text className="text-white text-lg font-bold">כסא {auc.originalSeat}</Text>
                  </View>
                </View>

                {/* Target Swap code if exists */}
                {auc.targetSeat && (
                  <View className="flex-row justify-end items-center gap-1.5 mb-4">
                    <Text className="text-primary text-xs font-bold">מחפש כסא: {auc.targetSeat}</Text>
                    <CornerDownLeft size={12} color={Colors.primary} />
                  </View>
                )}

                {/* Interactive Action CTA */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedAuction(auc);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 items-center justify-center"
                >
                  <Text className="text-white text-xs font-bold">הגש הצעת ביד או בקש החלפה</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Modal bid dialog */}
        {selectedAuction && (
          <Animated.View entering={FadeInDown} className="mt-8 bg-surfaceLight border border-primary/30 p-6 rounded-3xl">
            <View className="flex-row justify-between items-center mb-4">
              <Pressable onPress={() => setSelectedAuction(null)} className="w-8 h-8 rounded-full bg-white/5 items-center justify-center">
                <X size={16} color="white" />
              </Pressable>
              <Text className="text-white text-sm font-bold">הגש ביד על מושב {selectedAuction.originalSeat}</Text>
            </View>

            <Text style={{ textAlign: 'right' }} className="text-white/40 text-xs mb-3">
              הצעה נוכחית: {selectedAuction.highestBid || selectedAuction.pointsRequired} נקודות CinePass
            </Text>

            <TextInput
              value={bidValue}
              onChangeText={setBidValue}
              keyboardType="number-pad"
              placeholder="הכנס כמות נקודות..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={{ textAlign: 'right', fontFamily: 'Rubik-Regular' }}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-base mb-4"
            />

            <Pressable onPress={handlePlaceBid} className="rounded-2xl overflow-hidden">
              <LinearGradient colors={[Colors.primary, '#9B1B30']} className="py-3.5 flex-row justify-center items-center gap-2">
                <Gavel size={16} color="white" />
                <Text className="text-white text-sm font-bold">אשר הצעה</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

      </ScrollView>
    </View>
  );
}
