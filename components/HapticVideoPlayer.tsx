import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from '@/utils/safeExpoAv';

interface HapticVideoPlayerProps {
  videoRef: React.RefObject<any>;
  sourceUri: string;
  isPlaying: boolean;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
  style?: ViewStyle | any;
}

export const HapticVideoPlayer: React.FC<HapticVideoPlayerProps> = ({
  videoRef,
  sourceUri,
  isPlaying,
  onPlaybackStatusUpdate,
  style,
}) => {
  return (
    <Video
      ref={videoRef}
      source={{ uri: sourceUri }}
      style={[styles.video, style]}
      resizeMode={ResizeMode.COVER}
      shouldPlay={isPlaying}
      isLooping
      onPlaybackStatusUpdate={onPlaybackStatusUpdate}
    />
  );
};

const styles = StyleSheet.create({
  video: {
    ...StyleSheet.absoluteFill,
  },
});

export default HapticVideoPlayer;
