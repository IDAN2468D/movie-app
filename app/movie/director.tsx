import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Image, I18nManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useMovieCredits, useMovieDetails } from '@/hooks/useMovieQueries';
import { Colors } from '@/constants/Theme';
import { API_BASE_URL } from '@/constants/Config';
import { safeFetch } from '@/store/apiHelper';
import { useAuthStore } from '@/store/useAuthStore';
import { AIService } from '@/services/AIService';
import * as Haptics from 'expo-haptics';

import CineDirectorCast from '@/components/CineDirectorCast';
import CineDirectorPrompt from '@/components/CineDirectorPrompt';
import CineDirectorLoader from '@/components/CineDirectorLoader';
import CineDirectorStoryboard from '@/components/CineDirectorStoryboard';

interface StoryboardCard {
  sceneNumber: number;
  visualPrompt: string;
  dialogue: string;
}

interface PitchResult {
  id: string;
  movieTitle: string;
  posterConcept: string;
  scenes: StoryboardCard[];
}

export default function CineDirectorScreen() {
  const insets = useSafeAreaInsets();
  const { movieId: rawMovieId } = useLocalSearchParams<{ movieId: string }>();
  const movieId = parseInt(rawMovieId || '0', 10);

  const { data: movie } = useMovieDetails(movieId);
  const { data: cast = [], isLoading: isCastLoading } = useMovieCredits(movieId);

  const [prompt, setPrompt] = useState('');
  const [selectedActors, setSelectedActors] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pitchResult, setPitchResult] = useState<PitchResult | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [speakingSceneIdx, setSpeakingSceneIdx] = useState<number | null>(null);
  const [translatedActors, setTranslatedActors] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      AIService.stopSpeaking();
    };
  }, []);

  useEffect(() => {
    if (cast && cast.length > 0 && Object.keys(translatedActors).length === 0) {
      const names = cast.slice(0, 10).map((actor: any) => actor.name);
      AIService.translateActorNames(names)
        .then(mapping => {
          if (mapping && Object.keys(mapping).length > 0) {
            setTranslatedActors(mapping);
          }
        })
        .catch(err => console.warn('Cast translation failed:', err));
    }
  }, [cast]);

  const castWithHebrewNames = useMemo(() => {
    return cast.map((actor: any) => ({
      ...actor,
      name: translatedActors[actor.name] || actor.name
    }));
  }, [cast, translatedActors]);

  const handleToggleActor = (actorName: string) => {
    Haptics.selectionAsync();
    setSelectedActors(prev => {
      if (prev.includes(actorName)) {
        return prev.filter(a => a !== actorName);
      }
      if (prev.length >= 3) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return prev;
      }
      return [...prev, actorName];
    });
  };

  const handleVoiceRecord = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRecording) {
      setIsRecording(false);
      setPrompt('קרב חרבות מותח ברחובות העיר העתיקה מחוץ לחומות');
    } else {
      setIsRecording(true);
      setPrompt('מקליט קול...');
    }
  };

  const handleGeneratePitch = async () => {
    if (!prompt.trim() || selectedActors.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsGenerating(true);
    setPitchResult(null);
    AIService.stopSpeaking();
    setSpeakingSceneIdx(null);

    // 1. Try client-side generation first using EXPO_PUBLIC_GEMINI_API_KEY
    try {
      console.log('🎬 Attempting client-side Gemini storyboard generation...');
      const clientResult = await AIService.generatePitchClientSide(
        movie?.title || 'סרט חדש',
        prompt,
        selectedActors
      );

      if (clientResult && clientResult.scenes && clientResult.scenes.length === 3) {
        setPitchResult({
          id: 'client-gen-' + Date.now(),
          movieTitle: movie?.title || 'סרט חדש',
          posterConcept: clientResult.posterConcept,
          scenes: clientResult.scenes
        });

        // Save generated pitch to the backend in the background
        const token = useAuthStore.getState().token;
        safeFetch(`${API_BASE_URL}/director/pitch/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            movieId,
            movieTitle: movie?.title || 'סרט חדש',
            prompt,
            castList: selectedActors,
            posterConcept: clientResult.posterConcept,
            scenes: clientResult.scenes
          })
        }).catch(saveErr => console.warn('Background pitch save failed:', saveErr));

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsGenerating(false);
        return;
      }
    } catch (clientErr) {
      console.warn('⚠️ Client-side generation failed, falling back to server route:', clientErr);
    }

    // 2. Fallback to server-side generation
    try {
      const token = useAuthStore.getState().token;
      const response = await safeFetch(`${API_BASE_URL}/director/pitch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          movieId,
          movieTitle: movie?.title || 'סרט חדש',
          prompt,
          castList: selectedActors,
        })
      });

      if (response.success && response.data) {
        setPitchResult(response.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSpeakDialogue = (dialogueText: string, sceneIdx: number) => {
    if (speakingSceneIdx === sceneIdx) {
      AIService.stopSpeaking();
      setSpeakingSceneIdx(null);
    } else {
      AIService.stopSpeaking();
      setSpeakingSceneIdx(sceneIdx);
      AIService.speak(dialogueText, {
        onStart: () => setSpeakingSceneIdx(sceneIdx),
        onDone: () => setSpeakingSceneIdx(null),
        onStopped: () => setSpeakingSceneIdx(null),
        onError: () => setSpeakingSceneIdx(null)
      });
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Background Cover */}
      <View className="absolute inset-0">
        {movie?.poster_path && (
          <Image 
            source={{ uri: `https://image.tmdb.org/t/p/w1280${movie.poster_path}` }}
            className="w-full h-full"
            resizeMode="cover"
          />
        )}
        <BlurView intensity={95} tint="dark" className="absolute inset-0" />
        <LinearGradient 
          colors={['transparent', 'rgba(0,0,0,0.85)', Colors.background]} 
          className="absolute inset-0" 
        />
      </View>

      {/* Header */}
      <View 
        className="flex-row items-center px-6 pb-4 pt-2 gap-4 z-20"
        style={{ marginTop: insets.top }}
      >
        <Pressable 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }} 
          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 justify-center items-center active:scale-95"
        >
          {I18nManager.isRTL ? <ChevronRight size={24} color="white" /> : <ChevronLeft size={24} color="white" />}
        </Pressable>
        
        <View className="flex-1 items-start">
          <Text className="text-h2 text-white font-display leading-tight text-left">במאי אישי AI 🎬</Text>
          <Text className="text-caption text-white/50 font-medium text-left">הפק תסריט ולוח התרחשויות לסרט</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 mt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        
        {/* Component 1: Cast Selection */}
        <CineDirectorCast 
          cast={castWithHebrewNames}
          selectedActors={selectedActors}
          onToggleActor={handleToggleActor}
          isLoading={isCastLoading}
        />

        {/* Component 2: Input Prompt Area */}
        <CineDirectorPrompt 
          prompt={prompt}
          onChangePrompt={setPrompt}
          isRecording={isRecording}
          onToggleRecording={handleVoiceRecord}
          onSubmit={handleGeneratePitch}
          disabled={isGenerating || !prompt.trim() || selectedActors.length === 0}
        />

        {/* Component 3: Loading Film Scanner */}
        {isGenerating && <CineDirectorLoader />}

        {/* Component 4: Storyboard results */}
        {pitchResult && (
          <CineDirectorStoryboard 
            pitchResult={pitchResult}
            activeSlide={activeSlide}
            setActiveSlide={setActiveSlide}
            onSpeakDialogue={handleSpeakDialogue}
            speakingSceneIdx={speakingSceneIdx}
            movieBackdropPath={movie?.backdrop_path || undefined}
          />
        )}

      </ScrollView>
    </View>
  );
}
