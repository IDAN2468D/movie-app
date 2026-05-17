import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Film, Ticket, Tv, Users, DollarSign } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Rect, G, Text as SvgText, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

interface MovieStat {
  title: string;
  count: number;
  revenue: number;
  color: string;
}

const MOVIE_STATS: MovieStat[] = [
  { title: 'סופר מריו', count: 10, revenue: 2432.5, color: '#FF4B4B' },
  { title: 'מייקל', count: 3, revenue: 830, color: '#4B9EFF' },
  { title: 'מי אני עכשיו?', count: 3, revenue: 780, color: '#FFB84B' },
  { title: 'מורטל קומבט', count: 3, revenue: 620, color: '#4BFFB8' },
  { title: 'בלשי צמרת', count: 1, revenue: 422.5, color: '#B84BFF' },
];

const AnalyticsDashboard: React.FC = () => {
  const totalRevenue = 5475;
  const totalTickets = 21;
  const imaxCount = 13;
  const regularCount = 8;
  const standardSeats = 44;
  const vipSeats = 34;

  const maxRevenue = Math.max(...MOVIE_STATS.map(s => s.revenue));

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
              <Text className="text-white text-4xl font-bold tracking-tight">₪{totalRevenue.toLocaleString()}</Text>
            </View>
            <View className="bg-primary/20 p-3 rounded-2xl">
              <DollarSign size={28} color="#E50914" />
            </View>
          </View>
          <View className="flex-row items-center">
            <TrendingUp size={16} color="#4ADE80" />
            <Text className="text-green-400 font-assistant text-xs ml-1"> +12% מהשבוע שעבר</Text>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="w-[48%] rounded-3xl border border-white/10 p-4 mb-4 overflow-hidden bg-surfaceLight">
            <Ticket size={20} color="white" className="mb-2 opacity-60" />
            <Text className="text-white/60 font-assistant text-xs">הזמנות</Text>
            <Text className="text-white text-xl font-bold">{totalTickets}</Text>
          </View>
          
          <View className="w-[48%] rounded-3xl border border-white/10 p-4 mb-4 overflow-hidden bg-surfaceLight">
            <Users size={20} color="white" className="mb-2 opacity-60" />
            <Text className="text-white/60 font-assistant text-xs">סה"כ מושבים</Text>
            <Text className="text-white text-xl font-bold">{standardSeats + vipSeats}</Text>
          </View>
        </View>

        {/* Top Movies Bar Chart */}
        <Text className="text-white text-lg font-bold font-assistant mb-4 text-left">ביצועי סרטים (₪)</Text>
        <View className="rounded-3xl border border-white/10 p-6 mb-6 overflow-hidden bg-surfaceLight">
          {MOVIE_STATS.map((movie, index) => (
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
          ))}
        </View>

        {/* Format Distribution & Seats */}
        <View className="flex-row justify-between">
          <View className="w-[48%] rounded-3xl border border-white/10 p-5 overflow-hidden bg-surfaceLight">
            <Tv size={20} color="#E50914" className="mb-3" />
            <Text className="text-white font-bold mb-1 text-left">פורמטים</Text>
            <View className="flex-row justify-between items-center">
              <View className="items-center">
                <Text className="text-white/60 text-[10px]">IMAX</Text>
                <Text className="text-white font-bold">{imaxCount}</Text>
              </View>
              <View className="items-center">
                <Text className="text-white/60 text-[10px]">רגיל</Text>
                <Text className="text-white font-bold">{regularCount}</Text>
              </View>
            </View>
          </View>

          <View className="w-[48%] rounded-3xl border border-white/10 p-5 overflow-hidden bg-surfaceLight">
            <Users size={20} color="#E50914" className="mb-3" />
            <Text className="text-white font-bold mb-1 text-left">מושבים</Text>
            <View className="flex-row justify-between items-center">
              <View className="items-center">
                <Text className="text-white/60 text-[10px]">סטנדרטי</Text>
                <Text className="text-white font-bold">{standardSeats}</Text>
              </View>
              <View className="items-center">
                <Text className="text-white/60 text-[10px]">VIP</Text>
                <Text className="text-white font-bold">{vipSeats}</Text>
              </View>
            </View>
          </View>
        </View>

      </Animated.View>
    </ScrollView>
  );
};

export default AnalyticsDashboard;
