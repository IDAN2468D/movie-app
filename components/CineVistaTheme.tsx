import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { Music, MapPin, ShoppingBag } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface SceneFrame {
  id: string;
  name: string;
  thumbnail: string;
  colors: string[];
  vibe: string;
  spotifyLink: string;
  location: string;
  locationLink: string;
  fashionTip: string;
}

interface CineVistaThemeProps {
  movieId: number;
  movieTitle: string;
  onColorChange: (colors: string[]) => void;
}

export default function CineVistaTheme({ movieId, movieTitle, onColorChange }: CineVistaThemeProps) {
  const scenes: SceneFrame[] = [
    {
      id: 'scene_1',
      name: 'מבוא סייבר-ניאון',
      thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=150&q=80',
      colors: ['#FF1464', '#00F0FF'],
      vibe: 'Cyberpunk Neon Vibe',
      spotifyLink: 'https://open.spotify.com/playlist/37i9dQZF1DXdLTE7y1R4Yp',
      location: 'טוקיו, רובע שיבויה',
      locationLink: 'https://maps.google.com/?q=Shibuya+Crossing+Tokyo',
      fashionTip: 'ז\'קט עור שחור מבריק עם גזרה אסימטרית'
    },
    {
      id: 'scene_2',
      name: 'שקיעה מלנכולית',
      thumbnail: 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?auto=format&fit=crop&w=150&q=80',
      colors: ['#FFA500', '#4A0E0E'],
      vibe: 'Warm Melancholy Sunset',
      spotifyLink: 'https://open.spotify.com/playlist/37i9dQZF1DX8U52IPtqGXt',
      location: 'גרנד קניון, אריזונה',
      locationLink: 'https://maps.google.com/?q=Grand+Canyon+USA',
      fashionTip: 'סוודר אוברסייז בצבעי אדמה חמים'
    },
    {
      id: 'scene_3',
      name: 'היכל הזכוכית הלבן',
      thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=150&q=80',
      colors: ['#E5FF00', '#1E1E21'],
      vibe: 'Futuristic Minimalist Glass',
      spotifyLink: 'https://open.spotify.com/playlist/37i9dQZF1DX0rV78Ahn6x9',
      location: 'מוזיאון הלובר, פריז',
      locationLink: 'https://maps.google.com/?q=Louvre+Museum+Paris',
      fashionTip: 'חליפת מחויטת מינימליסטית בצבע לבן אוף-ווייט'
    }
  ];

  const [activeSceneId, setActiveSceneId] = useState<string>(scenes[0].id);

  const handleSelectScene = (scene: SceneFrame) => {
    setActiveSceneId(scene.id);
    onColorChange(scene.colors);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];

  return (
    <View className="mt-6 items-stretch">
      <Text 
        className="text-white text-base font-bold mb-1 text-right"
        style={{ fontFamily: 'Rubik-Bold', writingDirection: 'rtl' }}
      >
        CineVista - פורטל אסתטיקה
      </Text>
      
      <Text 
        className="text-[12px] text-textSecondary mb-4 leading-5 text-right"
        style={{ fontFamily: 'Inter-Regular', writingDirection: 'rtl' }}
      >
        בחר סצנה כדי להלביש את האפליקציה בצבעיה ולגלות מוזיקה, לוקיישנים ואופנה תואמים:
      </Text>

      {/* Horizontal Scene Slider */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerClassName="flex-row gap-3 pb-3"
      >
        {scenes.map((scene) => {
          const isActive = activeSceneId === scene.id;
          return (
            <Pressable
              key={scene.id}
              onPress={() => handleSelectScene(scene)}
              className={`w-[110px] p-2 rounded-2xl border items-center ${
                isActive 
                  ? 'border-secondary bg-secondary/5' 
                  : 'bg-white/[0.02] border-white/5'
              }`}
            >
              <Image 
                source={{ uri: scene.thumbnail }} 
                className="w-full h-[60px] rounded-[10px] mb-1.5"
              />
              <Text 
                className="text-[11px] text-white text-center"
                style={{ fontFamily: 'Rubik-Medium' }}
              >
                {scene.name}
              </Text>
              <View className="flex-row gap-1 mt-1.5">
                {scene.colors.map((c, idx) => (
                  <View 
                    key={idx} 
                    className="w-3 h-3 rounded-full border border-black/30" 
                    style={{ backgroundColor: c }}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Aesthetic Recommendations Box */}
      <Animated.View entering={FadeIn.duration(300)} key={activeSceneId}>
        <BlurView 
          intensity={20} 
          tint="dark" 
          className="mt-3 p-4 rounded-[20px] border border-white/5 overflow-hidden"
        >
          <Text 
            className="text-sm text-secondary mb-3 text-right"
            style={{ fontFamily: 'Rubik-Bold', writingDirection: 'rtl' }}
          >
            🔮 {activeScene.vibe}
          </Text>

          {/* Spotify */}
          <Pressable 
            onPress={() => Linking.openURL(activeScene.spotifyLink)} 
            className="flex-row items-center gap-3 py-2.5 border-b border-white/5"
          >
            <Music size={18} color={Colors.secondary} />
            <View className="flex-1 items-start">
              <Text 
                className="text-[13px] text-white text-right"
                style={{ fontFamily: 'Rubik-Medium', writingDirection: 'rtl' }}
              >
                פלייליסט סאונדטראק תואם
              </Text>
              <Text 
                className="text-[11px] text-[#71717A] mt-0.5 text-right"
                style={{ fontFamily: 'Inter-Regular', writingDirection: 'rtl' }}
              >
                לחץ כדי להאזין ב-Spotify לוויב של הסצנה
              </Text>
            </View>
          </Pressable>

          {/* Location */}
          <Pressable 
            onPress={() => Linking.openURL(activeScene.locationLink)} 
            className="flex-row items-center gap-3 py-2.5 border-b border-white/5"
          >
            <MapPin size={18} color={Colors.secondary} />
            <View className="flex-1 items-start">
              <Text 
                className="text-[13px] text-white text-right"
                style={{ fontFamily: 'Rubik-Medium', writingDirection: 'rtl' }}
              >
                לוקיישן השראה: {activeScene.location}
              </Text>
              <Text 
                className="text-[11px] text-[#71717A] mt-0.5 text-right"
                style={{ fontFamily: 'Inter-Regular', writingDirection: 'rtl' }}
              >
                לחץ כדי לצפות במפת גוגל
              </Text>
            </View>
          </Pressable>

          {/* Fashion */}
          <View className="flex-row items-center gap-3 py-2.5">
            <ShoppingBag size={18} color={Colors.secondary} />
            <View className="flex-1 items-start">
              <Text 
                className="text-[13px] text-white text-right"
                style={{ fontFamily: 'Rubik-Medium', writingDirection: 'rtl' }}
              >
                קוד לבוש ואופנה (Fashion DNA)
              </Text>
              <Text 
                className="text-[11px] text-[#71717A] mt-0.5 text-right"
                style={{ fontFamily: 'Inter-Regular', writingDirection: 'rtl' }}
              >
                {activeScene.fashionTip}
              </Text>
            </View>
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
}
