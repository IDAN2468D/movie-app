import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Navigation, Users, X, Car, Clock, ShieldCheck } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';

const { width } = Dimensions.get('window');

// Mock coordinates for squad members
const INITIAL_MEMBERS = [
  { name: 'דניאל (נהג)', status: 'driving', latOffset: -0.005, lngOffset: 0.004, eta: '12 דק׳' },
  { name: 'מיכל', status: 'passenger', latOffset: 0.003, lngOffset: -0.002, eta: '18 דק׳' },
  { name: 'אור', status: 'passenger', latOffset: 0.006, lngOffset: 0.008, eta: '5 דק׳' },
];

export default function CineSquadTransitScreen() {
  const insets = useSafeAreaInsets();
  const [myStatus, setMyStatus] = useState<'driving' | 'passenger' | 'arrived'>('driving');
  const [squadMembers, setSquadMembers] = useState(INITIAL_MEMBERS);
  const [sendingPosition, setSendingPosition] = useState(false);

  // Simulate positions updating on map
  useEffect(() => {
    const timer = setInterval(() => {
      setSquadMembers(prev => 
        prev.map(m => ({
          ...m,
          latOffset: m.latOffset + (Math.random() - 0.5) * 0.0008,
          lngOffset: m.lngOffset + (Math.random() - 0.5) * 0.0008,
        }))
      );
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const handleUpdateStatus = async (newStatus: 'driving' | 'passenger' | 'arrived') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMyStatus(newStatus);
    setSendingPosition(true);

    try {
      await fetch('http://localhost:5000/api/mcp/cinesquad/transit/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-dev-token'
        },
        body: JSON.stringify({
          squadId: 'squad-session-999',
          latitude: 32.0853 + (Math.random() - 0.5) * 0.01,
          longitude: 34.7818 + (Math.random() - 0.5) * 0.01,
          status: newStatus
        })
      });
    } catch (err) {
      console.warn('Squad location sync offline fallback:', err);
    } finally {
      setTimeout(() => setSendingPosition(false), 500);
    }
  };

  return (
    <View className="flex-1 bg-black">
      {/* Dark Map Canvas Mockup */}
      <View style={StyleSheet.absoluteFill} className="bg-zinc-950 items-center justify-center">
        {/* Map Grid Gridlines */}
        <View style={StyleSheet.absoluteFill} className="opacity-10">
          {Array.from({ length: 15 }).map((_, i) => (
            <View key={i} style={{ position: 'absolute', left: `${i * 8}%`, top: 0, bottom: 0, width: 1, backgroundColor: 'white' }} />
          ))}
          {Array.from({ length: 25 }).map((_, i) => (
            <View key={i} style={{ position: 'absolute', top: `${i * 5}%`, left: 0, right: 0, height: 1, backgroundColor: 'white' }} />
          ))}
        </View>

        {/* Outer boundaries / theater location pointer */}
        <View className="items-center">
          <View className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary items-center justify-center shadow-lg relative">
            <View className="w-4 h-4 rounded-full bg-primary" />
            {/* Pulsing ring animation */}
            <View className="w-24 h-24 rounded-full border border-primary/40 absolute opacity-70" />
          </View>
          <Text className="text-white text-xs font-bold mt-2 bg-black/60 px-3 py-1 rounded-full border border-white/10">קולנוע סינמקס</Text>
        </View>

        {/* Render Squad Member Pins on Map */}
        {squadMembers.map((member, index) => {
          const mapWidth = width;
          const mapHeight = Dimensions.get('window').height;
          const left = mapWidth / 2 + member.lngOffset * 8000;
          const top = mapHeight / 2 - member.latOffset * 8000;

          return (
            <View 
              key={index} 
              style={{ position: 'absolute', left, top }} 
              className="items-center"
            >
              <View className={`w-8 h-8 rounded-full border items-center justify-center shadow-lg ${member.status === 'driving' ? 'bg-secondary border-black' : 'bg-blue-600 border-white'}`}>
                {member.status === 'driving' ? <Car size={16} color="black" /> : <Users size={14} color="white" />}
              </View>
              <Text className="text-white text-[10px] bg-black/80 px-2 py-0.5 rounded border border-white/5 mt-1 font-semibold">{member.name}</Text>
            </View>
          );
        })}
      </View>

      {/* Screen Controls Overlays */}
      <View style={{ paddingTop: insets.top + 20 }} className="absolute top-0 left-0 right-0 px-6 flex-row justify-between items-center pointer-events-none">
        <Pressable onPress={() => router.back()} className="w-12 h-12 rounded-2xl bg-black/60 border border-white/10 items-center justify-center pointer-events-auto">
          <X size={24} color="white" />
        </Pressable>
        <View className="bg-black/60 px-4 py-2 rounded-full border border-white/10 pointer-events-auto flex-row items-center gap-2">
          <Users size={16} color={Colors.primary} />
          <Text className="text-white text-sm font-semibold">CineSquad Live</Text>
        </View>
      </View>

      {/* Dynamic Collapsible Bottom Sheet */}
      <Animated.View entering={FadeInUp.duration(900).delay(200)} className="absolute bottom-0 left-0 right-0 bg-surfaceLight border-t border-white/10 rounded-t-[36px] p-6 pb-12 shadow-2xl">
        <View className="w-12 h-1.5 bg-white/10 rounded-full self-center mb-6" />

        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center gap-1">
            <Clock size={16} color={Colors.secondary} />
            <Text className="text-secondary text-xs font-semibold">איסוף פעיל כעת</Text>
          </View>
          <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-lg font-bold">תיאום הגעה קבוצתית</Text>
        </View>

        {/* Location Status Option Buttons */}
        <View className="flex-row gap-3 mb-6">
          {(['driving', 'passenger', 'arrived'] as const).map((status) => (
            <Pressable
              key={status}
              onPress={() => handleUpdateStatus(status)}
              className={`flex-1 py-3 rounded-xl border flex-row justify-center items-center gap-2 ${myStatus === status ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5'}`}
            >
              {status === 'driving' && <Car size={16} color={myStatus === status ? Colors.primary : 'white'} />}
              {status === 'passenger' && <Users size={16} color={myStatus === status ? Colors.primary : 'white'} />}
              {status === 'arrived' && <ShieldCheck size={16} color={myStatus === status ? Colors.primary : 'white'} />}
              <Text className={`text-xs font-semibold ${myStatus === status ? 'text-primary' : 'text-white/60'}`}>
                {status === 'driving' ? 'אני נהג' : status === 'passenger' ? 'אני נוסע' : 'הגעתי!'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Members Status Row */}
        <ScrollView className="max-h-36 mb-4" showsVerticalScrollIndicator={false}>
          {squadMembers.map((member, i) => (
            <View key={i} className="flex-row justify-between items-center border-b border-white/5 py-3 px-1">
              <View className="flex-row items-center gap-2">
                <Clock size={14} color="#A1A1AA" />
                <Text className="text-white/60 text-xs">{member.eta}</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Text style={{ textAlign: 'right' }} className="text-white text-sm font-semibold">{member.name}</Text>
                <View className={`w-8 h-8 rounded-full items-center justify-center bg-white/5 border border-white/10`}>
                  {member.status === 'driving' ? <Car size={14} color={Colors.secondary} /> : <Users size={14} color="#3B82F6" />}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View className="bg-white/5 border border-white/10 p-3 rounded-2xl flex-row justify-between items-center">
          <Text className="text-white/40 text-xs">מיקום נמחק אוטומטית כעבור 3 שעות</Text>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-white/60 text-xs">סודיות ואבטחה מופעלים</Text>
            <View className="w-1.5 h-1.5 rounded-full bg-secondary" />
          </View>
        </View>

      </Animated.View>
    </View>
  );
}
