import React from 'react';
import { View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Bell, Calendar, Tag } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/constants/Theme';
import NotificationService from '@/services/NotificationService';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [reminders, setReminders] = React.useState(true);
  const [promos, setPromos] = React.useState(false);
  const [news, setNews] = React.useState(true);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-white/10 relative">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 justify-center items-center z-10">
          <ChevronRight size={24} color={Colors.text} />
        </Pressable>
        <View className="absolute inset-0 justify-center items-center">
          <Text style={[Typography.h2, { fontFamily: 'Rubik-Bold' }]} className="text-white">
            התראות
          </Text>
        </View>
      </View>
      
      <ScrollView className="flex-1 px-5 py-6">
        <Text style={{ fontFamily: 'Rubik-Medium', fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>נהל את ההתראות שברצונך לקבל</Text>
        
        <View className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden mb-6">
          <View className="flex-row items-center justify-between p-5 border-b border-white/5">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                <Calendar size={20} color={Colors.primary} />
              </View>
              <View className="ms-4 flex-1">
                <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 16, color: 'white' }}>תזכורות לסרטים</Text>
                <Text style={{ fontFamily: 'Rubik-Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>קבל התראה לפני שהסרט מתחיל</Text>
              </View>
            </View>
            <Switch value={reminders} onValueChange={setReminders} trackColor={{ false: '#3f3f46', true: Colors.primary }} />
          </View>

          <View className="flex-row items-center justify-between p-5 border-b border-white/5">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-secondary/20 items-center justify-center">
                <Tag size={20} color={Colors.secondary} />
              </View>
              <View className="ms-4 flex-1">
                <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 16, color: 'white' }}>מבצעים והנחות</Text>
                <Text style={{ fontFamily: 'Rubik-Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>קופונים ומבצעים מיוחדים עבורך</Text>
              </View>
            </View>
            <Switch 
              value={promos} 
              onValueChange={(value) => {
                setPromos(value);
                if (value) {
                  NotificationService.notifyPromoDeals();
                }
              }} 
              trackColor={{ false: '#3f3f46', true: Colors.secondary }} 
            />
          </View>

          <View className="flex-row items-center justify-between p-5">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center">
                <Bell size={20} color="#3B82F6" />
              </View>
              <View className="ms-4 flex-1">
                <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 16, color: 'white' }}>עדכוני מערכת</Text>
                <Text style={{ fontFamily: 'Rubik-Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>הודעות חשובות על האפליקציה</Text>
              </View>
            </View>
            <Switch value={news} onValueChange={setNews} trackColor={{ false: '#3f3f46', true: '#3B82F6' }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
