import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Film, Ticket, Tv, Users, DollarSign } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useBookingStore } from '../store/useBookingStore';

const { width } = Dimensions.get('window');

interface MovieStat {
  title: string;
  count: number;
  revenue: number;
  color: string;
}

const AnalyticsDashboard: React.FC = () => {
  const { myTickets, fetchMyTickets } = useBookingStore();
  const [isLoaded, setIsLoaded] = useState(false);

  // Load real tickets from server on mount
  useEffect(() => {
    const loadRealData = async () => {
      try {
        await fetchMyTickets();
      } catch (e) {
        console.warn('Failed to fetch real tickets from server:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadRealData();
  }, []);

  // 1. Calculate real stats from user's booked tickets
  let realRevenue = 0;
  let realTicketsCount = 0;
  let realImax = 0;
  let realRegular = 0;
  let realStandardSeats = 0;
  let realVipSeats = 0;

  const realMovieMap: Record<string, { count: number; revenue: number }> = {};

  myTickets.forEach((ticket) => {
    realRevenue += ticket.totalPrice || 0;
    const seatCount = ticket.seats?.length || 0;
    realTicketsCount += seatCount;

    if (ticket.showtime?.format === 'IMAX') {
      realImax += seatCount;
    } else {
      realRegular += seatCount;
    }

    ticket.seats?.forEach((seat) => {
      if (seat.type === 'vip') {
        realVipSeats += 1;
      } else {
        realStandardSeats += 1;
      }
    });

    const title = ticket.movieTitle || 'סרט כללי';
    if (!realMovieMap[title]) {
      realMovieMap[title] = { count: 0, revenue: 0 };
    }
    realMovieMap[title].count += seatCount;
    realMovieMap[title].revenue += ticket.totalPrice || 0;
  });

  // 2. Set display variables to represent real data only
  const displayRevenue = realRevenue;
  const displayTickets = realTicketsCount;
  const displayImax = realImax;
  const displayRegular = realRegular;
  const displayStandardSeats = realStandardSeats;
  const displayVipSeats = realVipSeats;

  // 3. Map real movie stats to array
  const displayMovieStats: MovieStat[] = [];
  const colors = ['#FF4B4B', '#4B9EFF', '#FFB84B', '#4BFFB8', '#B84BFF', '#FF4BE4', '#E4FF4B', '#4BFFE4'];
  Object.keys(realMovieMap).forEach((title, index) => {
    const real = realMovieMap[title];
    const color = colors[index % colors.length];
    displayMovieStats.push({
      title,
      count: real.count,
      revenue: real.revenue,
      color,
    });
  });

  // Sort by revenue descending
  displayMovieStats.sort((a, b) => b.revenue - a.revenue);

  const maxRevenue = Math.max(...displayMovieStats.map(s => s.revenue), 1);

  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#E50914" />
        <Text className="text-white/60 font-assistant mt-4">טוען נתוני אמת...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <Animated.View entering={FadeInDown.duration(600)} className="px-6 py-4">
        
        {/* Main Revenue Card */}
        <LinearGradient
          colors={['#1a1a1a', '#0a0a0a']}
          className="rounded-3xl border border-white/10 p-6 mb-6 overflow-hidden shadow-2xl"
        >
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-white/60 font-assistant text-sm">סה"כ הכנסות</Text>
              <Text className="text-white text-4xl font-bold tracking-tight">₪{displayRevenue.toLocaleString()}</Text>
            </View>
            <View className="bg-primary/20 p-3 rounded-2xl">
              <DollarSign size={28} color="#E50914" />
            </View>
          </View>
          <View className="flex-row items-center">
            <TrendingUp size={16} color="#4ADE80" />
            <Text className="text-green-400 font-assistant text-xs ml-1"> נתוני אמת מסונכרנים מהשרת 🎯</Text>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="w-[48%] rounded-3xl border border-white/10 p-4 mb-4 overflow-hidden bg-surfaceLight">
            <Ticket size={20} color="white" className="mb-2 opacity-60" />
            <Text className="text-white/60 font-assistant text-xs">הזמנות</Text>
            <Text className="text-white text-xl font-bold">{myTickets.length}</Text>
          </View>
          
          <View className="w-[48%] rounded-3xl border border-white/10 p-4 mb-4 overflow-hidden bg-surfaceLight">
            <Users size={20} color="white" className="mb-2 opacity-60" />
            <Text className="text-white/60 font-assistant text-xs">סה"כ מושבים</Text>
            <Text className="text-white text-xl font-bold">{displayStandardSeats + displayVipSeats}</Text>
          </View>
        </View>

        {/* Top Movies Bar Chart */}
        <Text className="text-white text-lg font-bold font-assistant mb-4 text-left">ביצועי סרטים (₪)</Text>
        <View className="rounded-3xl border border-white/10 p-6 mb-6 overflow-hidden bg-surfaceLight">
          {displayMovieStats.length === 0 ? (
            <Text className="text-white/60 font-assistant text-center py-4">אין עדיין הזמנות במערכת</Text>
          ) : (
            displayMovieStats.map((movie, index) => (
              <View key={movie.title} className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-white font-assistant text-xs">{movie.title}</Text>
                  <Text className="text-white/80 font-assistant text-xs">₪{movie.revenue}</Text>
                </View>
                <View className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <Animated.View 
                    entering={FadeInDown.delay(index * 100).duration(800)}
                    className="h-full rounded-full"
                    style={{ 
                      width: `${(movie.revenue / maxRevenue) * 100}%`,
                      backgroundColor: movie.color
                    }} 
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Format Distribution & Seats */}
        <View className="flex-row justify-between">
          <View className="w-[48%] rounded-3xl border border-white/10 p-5 overflow-hidden bg-surfaceLight">
            <Tv size={20} color="#E50914" className="mb-3" />
            <Text className="text-white font-bold mb-1 text-left">פורמטים</Text>
            <View className="flex-row justify-between items-center">
              <View className="items-center">
                <Text className="text-white/60 text-[10px]">IMAX</Text>
                <Text className="text-white font-bold">{displayImax}</Text>
              </View>
              <View className="items-center">
                <Text className="text-white/60 text-[10px]">רגיל</Text>
                <Text className="text-white font-bold">{displayRegular}</Text>
              </View>
            </View>
          </View>

          <View className="w-[48%] rounded-3xl border border-white/10 p-5 overflow-hidden bg-surfaceLight">
            <Users size={20} color="#E50914" className="mb-3" />
            <Text className="text-white font-bold mb-1 text-left">מושבים</Text>
            <View className="flex-row justify-between items-center">
              <View className="items-center">
                <Text className="text-white/60 text-[10px]">סטנדרטי</Text>
                <Text className="text-white font-bold">{displayStandardSeats}</Text>
              </View>
              <View className="items-center">
                <Text className="text-white/60 text-[10px]">VIP</Text>
                <Text className="text-white font-bold">{displayVipSeats}</Text>
              </View>
            </View>
          </View>
        </View>

      </Animated.View>
    </ScrollView>
  );
};

export default AnalyticsDashboard;
