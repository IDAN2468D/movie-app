import React, { useEffect } from 'react';
import { View, Text, Pressable, Image, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { Film, UserCheck } from 'lucide-react-native';

const SpringPresets = {
  snappy: {
    damping: 12,
    stiffness: 150,
    mass: 0.8,
  }
};

const ActorCard = ({ actor, isSelected, onToggle }: { actor: any; isSelected: boolean; onToggle: () => void }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.08 : 1, SpringPresets.snappy);
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, SpringPresets.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(isSelected ? 1.08 : 1, SpringPresets.snappy);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onToggle}
      className="items-center"
      style={{ minWidth: 72 }}
    >
      <Animated.View 
        style={[
          {
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isSelected ? 0.35 : 0,
            shadowRadius: 10,
            elevation: isSelected ? 6 : 0,
            borderColor: isSelected ? Colors.primary : 'rgba(255, 255, 255, 0.08)',
            backgroundColor: isSelected ? 'rgba(255, 20, 100, 0.08)' : 'rgba(255, 255, 255, 0.03)'
          },
          animatedStyle
        ]}
        className="p-[3px] rounded-2xl border"
      >
        <View className="relative w-[60px] h-[60px] rounded-xl overflow-hidden bg-black/25">
          {actor.profile_path ? (
            <Image 
              source={{ uri: `https://image.tmdb.org/t/p/w185${actor.profile_path}` }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Film size={20} color="white" opacity={0.3} />
            </View>
          )}
          
          {isSelected && (
            <View className="absolute inset-0 bg-primary/10" />
          )}
          
          {isSelected && (
            <View className="absolute bottom-1 left-1 w-4 h-4 bg-primary rounded-md items-center justify-center shadow-sm">
              <Text className="text-white text-[9px] font-bold">✓</Text>
            </View>
          )}
        </View>
      </Animated.View>
      <Text className="text-[11px] text-white/60 font-sans mt-2 text-center w-16" numberOfLines={1}>
        {actor.name}
      </Text>
    </Pressable>
  );
};

interface CineDirectorCastProps {
  cast: any[];
  selectedActors: string[];
  onToggleActor: (name: string) => void;
  isLoading: boolean;
}

export default function CineDirectorCast({ cast, selectedActors, onToggleActor, isLoading }: CineDirectorCastProps) {
  return (
    <View className="bg-surfaceGlass/40 border border-white/8 rounded-[24px] p-5 mb-5">
      <View className="flex-row items-center gap-2 mb-4 justify-start">
        <UserCheck size={18} color={Colors.primary} />
        <Text className="text-h3 text-white font-display text-left">1. ליהוק שחקנים (עד 3)</Text>
      </View>
      
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} size="small" className="py-4" />
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingStart: 4, paddingEnd: 4 }}
          className="-mx-5 px-5 py-2"
        >
          {cast.slice(0, 10).map((actor: any) => (
            <ActorCard 
              key={actor.id}
              actor={actor}
              isSelected={selectedActors.includes(actor.name)}
              onToggle={() => onToggleActor(actor.name)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
