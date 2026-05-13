/**
 * SeatMap - Interactive seat selection grid
 */
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Typography } from '@/constants/Theme';
import { useBookingStore, type Seat } from '@/store/useBookingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SeatMap() {
  const { seats, toggleSeat } = useBookingStore();

  if (seats.length === 0) return null;

  const cols = seats[0].length;
  const seatSize = Math.min((SCREEN_WIDTH - 60) / cols, 36);
  const gap = 4;

  const handleSeatPress = (seat: Seat) => {
    if (seat.status === 'taken') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSeat(seat.row, seat.number);
  };

  const getSeatColor = (seat: Seat) => {
    if (seat.status === 'selected') return Colors.seatSelected;
    if (seat.status === 'taken') return Colors.seatTaken;
    if (seat.type === 'vip') return Colors.seatVIP;
    return Colors.seatAvailable;
  };

  return (
    <View className="items-center py-5">
      {/* Cinematic Screen Indicator */}
      <View className="items-center mb-12 w-full px-10">
        <View 
          className="w-full h-2 bg-secondary/80 rounded-full" 
          style={{ 
            transform: [{ perspective: 1000 }, { rotateX: '-45deg' }, { scaleX: 1.2 }],
            shadowColor: Colors.secondary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.6,
            shadowRadius: 15,
            elevation: 15
          }}
        />
        <View 
          className="absolute -top-4 w-[85%] h-[40px] bg-secondary/10 rounded-full" 
          style={{ opacity: 0.5 }}
        />
        <Text className="text-caption text-textMuted mt-5 tracking-[4px] font-bold text-center uppercase opacity-60">
          מסך הקרנה
        </Text>
      </View>

      {/* Seat grid */}
      <View className="gap-1.5">
        {seats.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row-reverse items-center gap-2">
            <Text className="text-caption text-textMuted w-4 text-center">{row[0]?.row}</Text>
            <View className="flex-row-reverse" style={{ gap }}>
              {row.map((seat) => (
                <Pressable
                  key={`${seat.row}-${seat.number}`}
                  onPress={() => handleSeatPress(seat)}
                  className="justify-center items-center"
                  style={{
                    width: seatSize,
                    height: seatSize,
                    backgroundColor: getSeatColor(seat),
                    borderRadius: seat.type === 'vip' ? 10 : 6,
                    borderWidth: 1,
                    borderColor: seat.status === 'selected' ? Colors.white : 'rgba(255,255,255,0.05)',
                    // Simple shadow if selected
                    ...(seat.status === 'selected' && {
                      shadowColor: Colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.6,
                      shadowRadius: 8,
                      elevation: 6,
                    })
                  }}
                  disabled={seat.status === 'taken'}
                >
                  {seat.type === 'vip' && seat.status !== 'taken' && seat.status !== 'selected' && (
                    <Text className="text-[7px] font-black text-white/40">VIP</Text>
                  )}
                </Pressable>
              ))}
            </View>
            <Text className="text-caption text-textMuted w-4 text-center">{row[0]?.row}</Text>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View className="flex-row-reverse gap-4 mt-8 bg-surface px-5 py-3 rounded-full border border-border">
        <LegendItem color={Colors.seatAvailable} label="פנוי" />
        <LegendItem color={Colors.seatSelected} label="נבחר" />
        <LegendItem color={Colors.seatTaken} label="תפוס" />
        <LegendItem color={Colors.seatVIP} label="VIP" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row-reverse items-center gap-1.5">
      <View className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: color }} />
      <Text className="text-label text-textSecondary">{label}</Text>
    </View>
  );
}

// NativeWind migration complete - styles object removed
