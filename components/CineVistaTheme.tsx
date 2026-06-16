import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { Music, MapPin, ShoppingBag } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface SceneFrame {
  id: string;
  name: string;
  thumbnail: string; // url or mock local image placeholder
  colors: string[]; // hex codes e.g. ['#FF1464', '#E5FF00']
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
  // Mock scene data for any movie
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
    <View style={styles.container}>
      <Text style={styles.title}>CineVista - פורטל אסתטיקה</Text>
      <Text style={styles.subtitle}>בחר סצנה כדי להלביש את האפליקציה בצבעיה ולגלות מוזיקה, לוקיישנים ואופנה תואמים:</Text>

      {/* Horizontal Scene Slider */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sceneScroll}>
        {scenes.map((scene) => (
          <Pressable
            key={scene.id}
            onPress={() => handleSelectScene(scene)}
            style={[
              styles.sceneCard,
              activeSceneId === scene.id && styles.sceneCardActive
            ]}
          >
            <Image source={{ uri: scene.thumbnail }} style={styles.thumbnail} />
            <Text style={styles.sceneName}>{scene.name}</Text>
            <View style={styles.paletteRow}>
              {scene.colors.map((c, idx) => (
                <View key={idx} style={[styles.colorDot, { backgroundColor: c }]} />
              ))}
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Aesthetic Recommendations Box */}
      <Animated.View entering={FadeIn.duration(300)} key={activeSceneId}>
        <BlurView intensity={20} tint="dark" style={styles.glassPanel}>
          <Text style={styles.vibeTitle}>🔮 {activeScene.vibe}</Text>

          {/* Spotify */}
          <Pressable onPress={() => Linking.openURL(activeScene.spotifyLink)} style={styles.recommendationItem}>
            <Music size={18} color={Colors.secondary} />
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>פלייליסט סאונדטראק תואם</Text>
              <Text style={styles.itemDesc}>לחץ כדי להאזין ב-Spotify לוויב של הסצנה</Text>
            </View>
          </Pressable>

          {/* Location */}
          <Pressable onPress={() => Linking.openURL(activeScene.locationLink)} style={styles.recommendationItem}>
            <MapPin size={18} color={Colors.secondary} />
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>לוקיישן השראה: {activeScene.location}</Text>
              <Text style={styles.itemDesc}>לחץ כדי לצפות במפת גוגל</Text>
            </View>
          </Pressable>

          {/* Fashion */}
          <View style={styles.recommendationItem}>
            <ShoppingBag size={18} color={Colors.secondary} />
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>קוד לבוש ואופנה (Fashion DNA)</Text>
              <Text style={styles.itemDesc}>{activeScene.fashionTip}</Text>
            </View>
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    alignItems: 'stretch'
  },
  title: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: '#FAFAF7',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#A1A1AA',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 16,
    lineHeight: 18
  },
  sceneScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12
  },
  sceneCard: {
    width: 110,
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center'
  },
  sceneCardActive: {
    borderColor: '#E5FF00',
    backgroundColor: 'rgba(229, 255, 0, 0.04)'
  },
  thumbnail: {
    width: '100%',
    height: 60,
    borderRadius: 10,
    marginBottom: 6
  },
  sceneName: {
    fontSize: 11,
    fontFamily: 'Rubik-Medium',
    color: '#FAFAF7',
    textAlign: 'center'
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)'
  },
  glassPanel: {
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden'
  },
  vibeTitle: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
    color: '#E5FF00',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 12
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  itemTextContainer: {
    flex: 1,
    alignItems: 'flex-start'
  },
  itemTitle: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: '#FAFAF7',
    textAlign: 'left',
    writingDirection: 'rtl'
  },
  itemDesc: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#71717A',
    marginTop: 2,
    textAlign: 'left',
    writingDirection: 'rtl'
  }
});
