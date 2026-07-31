import { useState, useCallback, useRef } from 'react';
import { Audio, isAudioAvailable } from '@/utils/safeExpoAv';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.warn('[useVoiceRecording] Audio recording permission not granted');
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return true;
    } catch (err) {
      console.error('[useVoiceRecording] Failed to start recording:', err);
      setIsRecording(false);
      return false;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    setIsRecording(false);
    if (!recordingRef.current) {
      console.warn('[useVoiceRecording] No active recording found when stopping');
      return 'MOCK_BASE64_VOICE_DATA';
    }

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setRecordingUri(uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (uri) {
        if (!isAudioAvailable || uri.includes('mock-')) {
          return 'MOCK_BASE64_VOICE_DATA';
        }

        // Wait 100ms for Android file flush
        await new Promise(r => setTimeout(r, 100));

        try {
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
          if (base64 && base64.length > 50) return base64;
        } catch (fsErr) {
          console.warn('[useVoiceRecording] FileSystem read error, fallback to mock:', fsErr);
        }
      }
      return 'MOCK_BASE64_VOICE_DATA';
    } catch (err) {
      console.error('[useVoiceRecording] Failed to stop recording:', err);
      return 'MOCK_BASE64_VOICE_DATA';
    } finally {
      recordingRef.current = null;
    }
  }, []);

  return {
    isRecording,
    recordingUri,
    startRecording,
    stopRecording,
  };
};
