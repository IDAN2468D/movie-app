/**
 * Profile Screen - Premium Liquid Glass Redesign
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, TouchableOpacity, ImageBackground, StyleSheet, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Bell, CreditCard, Shield, ChevronLeft, LogOut, Ticket, Heart, History } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors, Typography } from '@/constants/Theme';
import { useProfile } from '@/hooks/useProfile';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    user,
    isAuthenticated,
    myTickets,
    handleLogout,
    sendTestEmail,
    handleResetOnboarding,
    navigateToSettings,
  } = useProfile();

  return (
    <View className="flex-1 bg-black">
      {/* Cinematic Header Background */}
      <View style={{ height: 320, position: 'absolute', top: 0, width: '100%' }}>
        <ImageBackground 
          source={{ uri: 'https://image.tmdb.org/t/p/w780/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg' }} 
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)', '#000000']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Header Actions */}
        <View className="flex-row justify-between items-center px-5 mb-5" style={{ paddingTop: insets.top + 20 }}>
          <Text style={[Typography.h1, { fontFamily: 'Rubik-Bold', color: 'white', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }]}>הפרופיל שלי</Text>
        </View>

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.duration(800).springify()} className="px-5 mb-8">
          <View className="rounded-[32px] overflow-hidden p-6 border border-white/10 shadow-lg bg-surfaceLight">
            {isAuthenticated && user ? (
              <View className="items-center">
                <View className="w-24 h-24 rounded-full bg-primary/20 justify-center items-center border-4 border-primary/50 shadow-xl mb-4 relative overflow-hidden">
                  {user.profileImage ? (
                    <Image source={{ uri: user.profileImage }} style={{ width: '100%', height: '100%', borderRadius: 48 }} resizeMode="cover" />
                  ) : (
                    <>
                      <LinearGradient colors={['rgba(255,20,100,0.2)', 'rgba(0,0,0,0)']} style={StyleSheet.absoluteFill} />
                      <User size={40} color={Colors.primary} />
                    </>
                  )}
                </View>
                <Text style={[Typography.h2, { fontFamily: 'Rubik-Bold' }]} className="text-white mb-1">{user.name}</Text>
                <Text style={[Typography.body, { fontFamily: 'Rubik-Regular' }]} className="text-white/50">{user.email}</Text>
                
                {/* Stats Row */}
                <View className="flex-row justify-between w-full mt-6 border-t border-white/10 pt-6">
                  <StatItem title="כרטיסים" value={myTickets.length.toString()} icon={Ticket} color={Colors.secondary} onPress={() => navigateToSettings('/tickets')} />
                  <View className="w-[1px] h-full bg-white/10 mx-2" />
                  <StatItem title="מועדפים" value={user.watchlist?.length.toString() || '0'} icon={Heart} color={Colors.primary} onPress={() => navigateToSettings('/settings/favorites')} />
                  <View className="w-[1px] h-full bg-white/10 mx-2" />
                  <StatItem title="היסטוריה" value={myTickets.length.toString()} icon={History} color="#3B82F6" onPress={() => navigateToSettings('/settings/history')} />
                </View>
              </View>
            ) : (
              <View className="items-center py-4">
                <Text style={[Typography.body, { fontFamily: 'Rubik-Regular' }]} className="text-white/40 italic">מתחבר...</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Menu Section */}
        <Animated.View entering={FadeInUp.duration(1000).delay(200).springify()} className="px-5 gap-4">
          <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 18, color: 'white', marginBottom: 4 }}>הגדרות חשבון</Text>
          
          <MenuItem icon={Bell} title="התראות" color={Colors.secondary} onPress={() => navigateToSettings('/settings/notifications')} />
          <MenuItem icon={CreditCard} title="אמצעי תשלום" color={Colors.primary} onPress={() => navigateToSettings('/settings/payment')} />
          <MenuItem icon={Shield} title="אבטחה ופרטיות" color="#3B82F6" onPress={() => navigateToSettings('/settings/security')} />
          
          {isAuthenticated && (
            <TouchableOpacity 
              onPress={handleLogout}
              className="flex-row items-center p-5 bg-white/5 rounded-2xl border border-red-500/20 mt-4 overflow-hidden"
            >
              <LinearGradient colors={['rgba(239, 68, 68, 0.1)', 'transparent']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={StyleSheet.absoluteFill} />
              <View className="w-10 h-10 rounded-xl justify-center items-center bg-red-500/10" style={{ marginStart: 4 }}>
                <LogOut size={20} color="#EF4444" />
              </View>
              <Text style={[Typography.body, { color: '#EF4444', fontFamily: 'Rubik-Bold', marginStart: 16, textAlign: 'left' }]} className="flex-1 font-semibold">התנתקות מהחשבון</Text>
            </TouchableOpacity>
          )}

          {/* Developer Tools - For Testing */}
          <View className="mt-8 mb-4">
            <Text className="text-white/30 text-xs font-body mb-2 text-center">כלי פיתוח (לצורך בדיקות בלבד)</Text>
            
            <TouchableOpacity 
              onPress={sendTestEmail}
              className="flex-row items-center justify-center p-3 bg-white/5 rounded-xl border border-white/5 mb-2"
            >
              <Text className="text-white/40 font-body text-xs">שלח מייל בדיקה (Test Email)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleResetOnboarding}
              className="flex-row items-center justify-center p-3 bg-white/5 rounded-xl border border-white/5"
            >
              <Text className="text-white/40 font-body text-xs">אפס מצב הדרכה (Reset Onboarding)</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatItem({ title, value, icon: Icon, color, onPress }: { title: string; value: string; icon: any; color: string; onPress?: () => void }) {
  return (
    <Pressable className="flex-1 items-center" onPress={onPress}>
      <View className="flex-row items-center gap-1.5 mb-2">
        <Icon size={14} color={color} />
        <Text style={{ fontFamily: 'Rubik-Medium', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{title}</Text>
      </View>
      <Text style={{ fontFamily: 'Anton-Regular', fontSize: 24, color: 'white' }}>{value}</Text>
    </Pressable>
  );
}

function MenuItem({ icon: Icon, title, color, onPress }: { icon: any; title: string; color: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center p-4 bg-white/5 rounded-2xl border border-white/10 overflow-hidden relative">
      <View className="w-12 h-12 rounded-xl justify-center items-center shadow-sm" style={{ backgroundColor: color + '15', marginStart: 4 }}>
        <Icon size={22} color={color} />
      </View>
      <Text style={[Typography.body, { fontFamily: 'Rubik-Medium', fontSize: 16, textAlign: 'left' }]} className="flex-1 text-white ms-4">{title}</Text>
      <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center">
        <ChevronLeft size={16} color="rgba(255,255,255,0.5)" />
      </View>
    </Pressable>
  );
}
