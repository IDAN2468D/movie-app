import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { Colors } from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

interface StoryItem {
  id: number;
  title: string;
  poster: string;
}

interface StoriesRowProps {
  stories: StoryItem[];
  onStoryPress: (index: number) => void;
}

const getTMDBImage = (path: string, size: 'original' | 'w500' | 'w200' = 'original') => {
  if (!path) return '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `https://image.tmdb.org/t/p/${size}${cleanPath}`;
};

export default function StoriesRow({ stories, onStoryPress }: StoriesRowProps) {
  return (
    <View className="py-4">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {stories.map((story, index) => (
          <Pressable 
            key={story.id} 
            onPress={() => onStoryPress(index)}
            className="items-center gap-2"
          >
            <View className="p-[3px] rounded-full border-2 border-primary">
              <View className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-surface">
                <Image 
                  source={{ uri: getTMDBImage(story.poster, 'w200') }} 
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            </View>
            <Text 
              numberOfLines={1} 
              className="text-white text-[10px] w-16 text-center font-medium"
              style={{ writingDirection: 'rtl' }}
            >
              {story.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
