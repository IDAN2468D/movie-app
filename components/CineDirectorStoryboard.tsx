import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Dimensions, Image, ActivityIndicator } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler, 
  interpolate, 
  withRepeat, 
  withSequence, 
  withTiming,
  SharedValue
} from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { Play } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '@/constants/Config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_WIDTH = SCREEN_WIDTH - 64; 
const CARD_GAP = 16;                  
const SIDE_PADDING = 32;              
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

interface StoryboardCardProps {
  scene: {
    sceneNumber: number;
    visualPrompt: string;
    visualPromptEnglish?: string;
    dialogue: string;
  };
  index: number;
  scrollX: SharedValue<number>;
  isSpeaking: boolean;
  onSpeak: () => void;
  movieBackdropPath?: string;
}

const EqualizerBar = ({ index }: { index: number }) => {
  const height = useSharedValue(4);
  useEffect(() => {
    height.value = withRepeat(
      withSequence(
        withTiming(12 + (index % 2) * 4, { duration: 150 + (index % 3) * 50 }),
        withTiming(4, { duration: 150 + (index % 3) * 50 })
      ),
      -1,
      true
    );
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[{ width: 2, backgroundColor: Colors.secondary, borderRadius: 1 }, barStyle]} />;
};

const TinyEqualizer = () => {
  return (
    <View className="flex-row gap-0.5 items-end justify-center h-3 px-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <EqualizerBar key={i} index={i} />
      ))}
    </View>
  );
};

const StoryboardCard = ({ scene, index, scrollX, isSpeaking, onSpeak, movieBackdropPath }: StoryboardCardProps) => {
  const [isAiImageLoaded, setIsAiImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imgUri, setImgUri] = useState<string | null>(null);
  const aiImageOpacity = useSharedValue(0);

  useEffect(() => {
    if (isAiImageLoaded) {
      aiImageOpacity.value = withTiming(1, { duration: 800 });
    } else {
      aiImageOpacity.value = 0;
    }
  }, [isAiImageLoaded]);

  const promptToUse = scene.visualPromptEnglish || scene.visualPrompt;
  const promptWithModifiers = promptToUse + ', cinematic film scene, movie shot, highly detailed, dramatic lighting, 8k resolution';

  useEffect(() => {
    const hfToken = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
    if (!hfToken) {
      console.warn('⚠️ EXPO_PUBLIC_HUGGINGFACE_API_KEY is not configured in client .env');
      setImageLoadError(true);
      return;
    }

    let isMounted = true;
    setIsAiImageLoaded(false);
    setImageLoadError(false);
    setImgUri(null);

    console.log(`🎨 Storyboard Scene ${scene.sceneNumber} image prompt: "${promptToUse}" [${scene.visualPromptEnglish ? 'English' : 'Hebrew Fallback'}]`);

    fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${hfToken}`
        },
        body: JSON.stringify({ inputs: promptWithModifiers })
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || `HTTP ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        if (!isMounted) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!isMounted) return;
          setImgUri(reader.result as string);
          setIsAiImageLoaded(true);
          console.log(`🖼️ Image generated successfully for scene ${scene.sceneNumber}`);
        };
        reader.readAsDataURL(blob);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.warn(`❌ Image generation failed for scene ${scene.sceneNumber}:`, error.message);
        setImageLoadError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [promptToUse]);

  const animatedCardStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SNAP_INTERVAL,
      index * SNAP_INTERVAL,
      (index + 1) * SNAP_INTERVAL
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.92, 1.0, 0.92],
      'clamp'
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.6, 1.0, 0.6],
      'clamp'
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const animatedAiImageStyle = useAnimatedStyle(() => ({
    opacity: aiImageOpacity.value,
  }));

  const backdropUrl = movieBackdropPath 
    ? `https://image.tmdb.org/t/p/w500${movieBackdropPath}` 
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';

  // Image is loaded via useEffect fetch and stored as base64 in imgUri

  return (
    <Animated.View 
      style={[
        { width: CARD_WIDTH },
        animatedCardStyle
      ]}
      className="bg-surfaceGlass/40 border border-white/8 rounded-[32px] p-5 min-h-[240px] justify-between overflow-hidden"
    >
      {/* Scene Cover Image Card */}
      <View className="w-full h-32 rounded-2xl overflow-hidden mb-4 relative bg-black/40">
        {/* Placeholder: TMDB Movie Backdrop (Instant Load) */}
        <Image 
          source={{ uri: backdropUrl }}
          className="w-full h-full absolute inset-0"
          resizeMode="cover"
        />

        {/* Custom AI generated Scene Image (Loads in Background) */}
        {imgUri && (
          <Animated.Image 
            source={{ uri: imgUri }}
            style={[{ position: 'absolute', inset: 0 }, animatedAiImageStyle]}
            resizeMode="cover"
          />
        )}

        {/* Dynamic Generating Badge */}
        {!isAiImageLoaded && !imageLoadError && (
          <View className="absolute bottom-3 right-3 bg-black/60 border border-white/10 px-2 py-1 rounded-lg flex-row items-center gap-1.5">
            <ActivityIndicator color={Colors.secondary} size="small" style={{ transform: [{ scale: 0.7 }] }} />
            <Text className="text-[9px] text-white/90 font-sans">מצייר סצנה ב-AI...</Text>
          </View>
        )}

        {imageLoadError && (
          <View className="absolute bottom-3 right-3 bg-red-950/80 border border-red-500/30 px-2.5 py-1 rounded-lg flex-row items-center gap-1.5">
            <Text className="text-[9px] text-red-300 font-sans">ציור AI לא זמין - מציג רקע סרט 🍿</Text>
          </View>
        )}
        
        <View className="absolute inset-0 bg-primary/5 mix-blend-overlay" />
        <LinearGradient 
          colors={['transparent', 'rgba(0,0,0,0.8)']} 
          className="absolute inset-0"
        />
        <View className="absolute top-3 right-3 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full">
          <Text className="text-[10px] text-primary font-bold font-sans">סצנה {scene.sceneNumber}</Text>
        </View>
        <View className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/40 border border-white/10 items-center justify-center">
          <Play size={12} color="white" opacity={0.8} />
        </View>
      </View>

      <View className="mb-4 items-start">
        <Text className="text-[10px] text-white/40 font-bold font-sans text-left uppercase tracking-wider mb-1">הנחיות ויזואליות</Text>
        <Text className="text-body text-white font-medium text-left leading-relaxed">{scene.visualPrompt}</Text>
      </View>

      <View className="p-4 bg-black/30 rounded-2xl border border-white/5 items-start">
        <View className="flex-row justify-between items-center w-full mb-2">
          <Pressable 
            onPress={onSpeak}
            className="px-3 py-1 bg-secondary/15 border border-secondary/30 rounded-full flex-row items-center gap-1 active:scale-95"
          >
            <Text className="text-[10.5px] text-secondary font-bold font-sans">
              {isSpeaking ? 'מנגן... ⏸️' : 'הקרא דיאלוג 🔊'}
            </Text>
            {isSpeaking && <TinyEqualizer />}
          </Pressable>
          <Text className="text-[10px] text-primary font-bold font-sans text-left uppercase tracking-wider">דיאלוג</Text>
        </View>
        <Text className="text-body text-white/90 font-body text-left italic leading-relaxed">
          {scene.dialogue}
        </Text>
      </View>
    </Animated.View>
  );
};

interface StoryboardCardData {
  sceneNumber: number;
  visualPrompt: string;
  visualPromptEnglish?: string;
  dialogue: string;
}

interface CineDirectorStoryboardProps {
  pitchResult: {
    posterConcept: string;
    scenes: StoryboardCardData[];
  };
  activeSlide: number;
  setActiveSlide: (idx: number) => void;
  onSpeakDialogue: (dialogue: string, sceneIdx: number) => void;
  speakingSceneIdx: number | null;
  movieBackdropPath?: string;
}

export default function CineDirectorStoryboard({
  pitchResult,
  activeSlide,
  setActiveSlide,
  onSpeakDialogue,
  speakingSceneIdx,
  movieBackdropPath
}: CineDirectorStoryboardProps) {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleScrollEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    setActiveSlide(index);
  };

  return (
    <View className="mb-10">
      <View 
        style={{ borderStartColor: Colors.secondary, borderStartWidth: 3 }}
        className="bg-surfaceGlass/40 border border-white/5 rounded-[24px] p-5 mb-6"
      >
        <Text className="text-xs text-secondary font-bold font-display text-left mb-1">קונספט כרזת הסרט (Poster concept):</Text>
        <Text className="text-body text-white/90 font-sans text-left leading-relaxed">{pitchResult.posterConcept}</Text>
      </View>

      <Text className="text-h3 text-white text-left mb-4 font-display">לוח התרחשויות (Storyboard):</Text>

      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="center"
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{ 
          paddingHorizontal: SIDE_PADDING,
          gap: CARD_GAP
        }}
        className="-mx-6 py-2"
      >
        {pitchResult.scenes.map((scene, idx) => (
          <StoryboardCard 
            key={scene.sceneNumber}
            scene={scene}
            index={idx}
            scrollX={scrollX}
            isSpeaking={speakingSceneIdx === idx}
            onSpeak={() => onSpeakDialogue(scene.dialogue, idx)}
            movieBackdropPath={movieBackdropPath}
          />
        ))}
      </Animated.ScrollView>

      <View className="flex-row justify-center gap-2 mt-5">
        {pitchResult.scenes.map((_, idx) => (
          <View 
            key={idx} 
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeSlide ? 'w-5 bg-primary' : 'w-1.5 bg-white/20'}`} 
          />
        ))}
      </View>
    </View>
  );
}
