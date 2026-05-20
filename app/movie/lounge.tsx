import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLounge, MOOD_CAPSULES, SOUNDTRACKS } from '@/hooks/useLounge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function LoungeScreen() {
  const insets = useSafeAreaInsets();
  const {
    selectedTrack, isPlaying, isSurround, volume,
    selectedMood, setSelectedMood, customPrompt, setCustomPrompt,
    narrativeText, isGenerating, isSpeaking,
    togglePlay, handleTrackChange, handleVolumeAdjust, toggleSurround,
    generateAtmosphere, speakNarrative, goBack,
    primaryWaveProps, secondaryWaveProps, voiceWaveProps,
  } = useLounge();


  return (
    <View className="flex-1 bg-background" style={{ paddingBottom: insets.bottom }}>
      {/* Premium Cinematic Background Gradient */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#0F0A1A', '#06040A', '#000000']}
          style={StyleSheet.absoluteFill}
        />
        {/* Neon Light Spheres (Ambient Glows) */}
        <View style={[styles.glowSphere, { top: '10%', right: '-20%', backgroundColor: Colors.primary, opacity: 0.12 }]} />
        <View style={[styles.glowSphere, { bottom: '25%', left: '-30%', backgroundColor: '#06B6D4', opacity: 0.1 }]} />
      </View>

      {/* Screen Header - Custom LTR Row Flow */}
      <View className="flex-row-reverse items-center justify-between px-6 pt-4 mb-4" style={{ marginTop: insets.top }}>
        <Pressable
          testID="back-button"
          onPress={goBack}
          className="w-10 h-10 rounded-full border border-white/10 items-center justify-center bg-black/35"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.white} />
        </Pressable>
        <Text className="text-white text-xl font-bold font-assistant text-left" style={{ writingDirection: 'ltr' }}>
          🎧 טרקלין סאונד מרחבי
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
      >
        {/* Glass Visualizer Screen Box */}
        <View className="rounded-3xl border border-white/10 overflow-hidden bg-surfaceLight/30 mb-6">
          <BlurView intensity={25} tint="dark" className="p-6">
            <View className="items-center justify-center h-44 mb-4">
              {/* Neon Glow Visualizer Waves */}
              <Svg width="100%" height="160" viewBox="0 0 360 160" fill="none">
                <Defs>
                  <SvgGradient id="pinkGlow" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.8" />
                    <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
                  </SvgGradient>
                  <SvgGradient id="cyanGlow" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor="#06B6D4" stopOpacity="0.6" />
                    <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.6" />
                  </SvgGradient>
                  <SvgGradient id="yellowGlow" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor={Colors.secondary} stopOpacity="0.9" />
                    <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0.9" />
                  </SvgGradient>
                </Defs>

                {/* Overlapping glowing wave paths */}
                <AnimatedPath
                  animatedProps={secondaryWaveProps}
                  stroke="url(#cyanGlow)"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <AnimatedPath
                  animatedProps={primaryWaveProps}
                  stroke="url(#pinkGlow)"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <AnimatedPath
                  animatedProps={voiceWaveProps}
                  stroke="url(#yellowGlow)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
              </Svg>

              {/* Status Pill Badge - LTR styled */}
              <View className="absolute bottom-2 flex-row-reverse items-center px-4 py-1.5 rounded-full border border-white/10 bg-black/60">
                <View
                  className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-secondary animate-pulse' : (isPlaying ? 'bg-primary' : 'bg-zinc-600')}`}
                  style={{ marginLeft: 8 }}
                />
                <Text className="text-[11px] font-bold font-assistant text-white" style={{ writingDirection: 'ltr', textAlign: 'left' }}>
                  {isSpeaking ? 'קריינות AI פעילה' : (isPlaying ? 'צליל היקפי פועל' : 'מצב השמעה מושהה')}
                </Text>
              </View>
            </View>

            {/* Media Controls Box */}
            <View className="flex-row items-center justify-between border-t border-white/5 pt-5 px-2">
              {/* Spatial Delay Button */}
              <Pressable
                onPress={toggleSurround}
                className={`w-12 h-12 rounded-full items-center justify-center border ${isSurround ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-white/5 border-white/10'}`}
              >
                <Ionicons name="infinite" size={24} color={isSurround ? Colors.success : Colors.textSecondary} />
              </Pressable>

              {/* Central Play/Pause button */}
              <Pressable
                testID="play-pause-button"
                onPress={togglePlay}
                className="w-16 h-16 rounded-full items-center justify-center border border-white/15 shadow-xl bg-primary"
                style={({ pressed }) => [
                  pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }
                ]}
              >
                <Ionicons name={isPlaying ? "pause" : "play"} size={30} color={Colors.white} />
              </Pressable>

              {/* Volume Adjusters */}
              <View className="flex-row items-center border border-white/10 rounded-full p-1 bg-white/5 gap-2">
                <Pressable
                  onPress={() => handleVolumeAdjust('down')}
                  className="w-9 h-9 rounded-full items-center justify-center"
                >
                  <Ionicons name="volume-low" size={18} color={Colors.textSecondary} />
                </Pressable>
                <Text className="text-white text-xs font-bold font-assistant w-7 text-center">
                  {Math.round(volume * 100)}%
                </Text>
                <Pressable
                  onPress={() => handleVolumeAdjust('up')}
                  className="w-9 h-9 rounded-full items-center justify-center"
                >
                  <Ionicons name="volume-high" size={18} color={Colors.textSecondary} />
                </Pressable>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Ambient Track Selection Selector */}
        <Text className="text-white text-base font-bold font-assistant text-left mb-3" style={{ writingDirection: 'ltr' }}>
          🎵 בחרו מנגינת רקע סביבתית
        </Text>
        <View className="gap-3 mb-6">
          {SOUNDTRACKS.map((track) => {
            const isSelected = selectedTrack === track.id;
            return (
              <Pressable
                key={track.id}
                onPress={() => handleTrackChange(track.id)}
                className={`rounded-2xl border p-4 flex-row-reverse items-center justify-between transition ${isSelected ? 'bg-primary/10 border-primary' : 'bg-surfaceLight/40 border-white/5'}`}
              >
                <View className="w-6 h-6 rounded-full border-2 items-center justify-center" style={{ borderColor: isSelected ? Colors.primary : 'rgba(255,255,255,0.2)' }}>
                  {isSelected && <View className="w-3 h-3 rounded-full bg-primary" />}
                </View>
                <View className="flex-1 px-4 text-left">
                  <Text className="text-white text-sm font-bold font-assistant text-left mb-0.5" style={{ writingDirection: 'ltr' }}>
                    {track.title}
                  </Text>
                  <Text className="text-white/50 text-[11px] font-assistant text-left" style={{ writingDirection: 'ltr' }}>
                    {track.description}
                  </Text>
                </View>
                <Ionicons name="musical-notes-outline" size={20} color={isSelected ? Colors.primary : Colors.textMuted} />
              </Pressable>
            );
          })}
        </View>

        {/* AI Mood Capsule Controls */}
        <Text className="text-white text-base font-bold font-assistant text-left mb-3" style={{ writingDirection: 'ltr' }}>
          🌌 קפסולות מצבי רוח וקריינות AI
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row gap-3 mb-5"
        >
          {MOOD_CAPSULES.map((mood) => {
            const isSelected = selectedMood === mood.id;
            return (
              <Pressable
                key={mood.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedMood(mood.id);
                }}
                className={`flex-row-reverse items-center px-4 py-3 rounded-full border ${isSelected ? 'bg-secondary border-secondary text-black' : 'bg-surfaceLight/60 border-white/10'}`}
                style={{ marginHorizontal: 4 }}
              >
                <Text className="text-sm mr-1.5">{mood.emoji}</Text>
                <Text
                  className={`text-xs font-bold font-assistant ${isSelected ? 'text-black' : 'text-white'}`}
                  style={{ marginLeft: 6 }}
                >
                  {mood.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Custom mood prompt input */}
        <View className="rounded-2xl border border-white/10 bg-surfaceLight/30 p-4 mb-6">
          <Text className="text-white/60 text-xs font-assistant text-left mb-2" style={{ writingDirection: 'ltr' }}>
            הקלידו רעיון חופשי לאווירה (למשל: "קרב חלליות דרמטי סביב צדק עם לייזרים תלת-ממדיים"):
          </Text>
          <TextInput
            value={customPrompt}
            onChangeText={setCustomPrompt}
            placeholder="מתח גבוה, צלילי מדע בדיוני..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white font-assistant text-right text-sm mb-4"
            multiline
            numberOfLines={2}
            style={{ writingDirection: 'rtl', textAlign: 'right' }}
          />

          {/* Trigger generator CTA Button */}
          <Pressable
            onPress={generateAtmosphere}
            disabled={isGenerating}
            className="rounded-xl overflow-hidden"
          >
            <LinearGradient
              colors={isGenerating ? ['#3F3F46', '#27272A'] : [Colors.primary, '#9B1B30']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-3.5 flex-row items-center justify-center gap-2"
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View className="flex-row items-center justify-center gap-2">
                  <Ionicons name="sparkles" size={18} color={Colors.white} />
                  <Text className="text-white font-bold font-assistant text-sm">
                    צור אווירה קולנועית ב-AI
                  </Text>
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* Cinematic Hebrew Narrative output script */}
        {!!narrativeText && (
          <View className="rounded-3xl border border-white/15 overflow-hidden bg-surfaceLight/50 mb-4">
            <BlurView intensity={35} tint="dark" className="p-6">
              <View className="flex-row-reverse items-center justify-between border-b border-white/10 pb-3 mb-4">
                {!isGenerating && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      speakNarrative(narrativeText);
                    }}
                    disabled={isSpeaking}
                    className={`w-9 h-9 rounded-full items-center justify-center border ${isSpeaking ? 'bg-secondary/20 border-secondary/40' : 'bg-white/10 border-white/10'}`}
                  >
                    <Ionicons name="volume-medium-outline" size={18} color={isSpeaking ? Colors.secondary : Colors.white} />
                  </Pressable>
                )}
                <View className="flex-row-reverse items-center">
                  <Ionicons name="chatbox-ellipses-outline" size={18} color={Colors.primary} />
                  <Text className="text-white/60 text-xs font-assistant font-bold ml-2" style={{ marginLeft: 6, writingDirection: 'ltr' }}>
                    תסריט אווירה נוצר ב-AI
                  </Text>
                </View>
              </View>

              <Text className="text-white text-base font-assistant leading-7 text-left" style={{ writingDirection: 'ltr' }}>
                {narrativeText}
              </Text>
            </BlurView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  glowSphere: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
  },
});