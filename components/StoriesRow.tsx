import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { getImageSource, handleImageError } from '../utils/ImageUtils';

interface StoryItem {
  id: number;
  title: string;
  poster: string;
}

interface StoriesRowProps {
  stories: StoryItem[];
  onStoryPress: (index: number) => void;
}

/**
 * רכיב מעגל סיפור בודד לניהול מצב תמונה עצמאי
 */
function StoryCircle({ story, onPress }: { story: StoryItem, onPress: () => void }) {
  const [source, setSource] = useState(getImageSource(story.poster, 'poster', 'small'));

  return (
    <Pressable 
      onPress={onPress}
      className="items-center gap-2"
    >
      <View className="p-[3px] rounded-full border-2 border-primary">
        <View className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-surface">
          <Image 
            source={source} 
            className="w-full h-full"
            resizeMode="cover"
            onError={() => handleImageError(setSource, 'poster')}
          />
        </View>
      </View>
      <Text 
        numberOfLines={1} 
        className="text-white text-[10px] w-16 text-center font-medium"
        style={{ writingDirection: 'ltr' }}
      >
        {story.title}
      </Text>
    </Pressable>
  );
}

export default function StoriesRow({ stories, onStoryPress }: StoriesRowProps) {
  return (
    <View className="py-4">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {stories.map((story, index) => (
          <StoryCircle 
            key={story.id} 
            story={story} 
            onPress={() => onStoryPress(index)} 
          />
        ))}
      </ScrollView>
    </View>
  );
}
