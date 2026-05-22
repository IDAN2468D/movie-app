/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-require-imports */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import LoungeScreen from '../../app/movie/lounge';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { AIService } from '../../services/AIService';
import { router } from 'expo-router';

// Mock expo-av
jest.mock('expo-av', () => {
  const mockSoundInstance = {
    unloadAsync: jest.fn(() => Promise.resolve()),
    stopAsync: jest.fn(() => Promise.resolve()),
    pauseAsync: jest.fn(() => Promise.resolve()),
    playAsync: jest.fn(() => Promise.resolve()),
    setVolumeAsync: jest.fn(() => Promise.resolve()),
    setStatusAsync: jest.fn(() => Promise.resolve()),
  };

  return {
    Audio: {
      Sound: {
        createAsync: jest.fn(() => Promise.resolve({ sound: mockSoundInstance })),
      },
    },
  };
});

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn((text, options) => {
    if (options && options.onStart) options.onStart();
    if (options && options.onDone) {
      // Simulate speech completing synchronously to clean up state
      options.onDone();
    }
  }),
  stop: jest.fn(),
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Svg: View,
    Path: View,
    Defs: View,
    LinearGradient: View,
    Stop: View,
  };
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    LinearGradient: View,
  };
});

// Mock AIService
jest.mock('../../services/AIService', () => ({
  AIService: {
    generateAtmosphereNarrative: jest.fn(() => Promise.resolve('טקסט אווירה מדהים שנוצר על ידי ה-AI.')),
  },
}));

describe('LoungeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with title and preset cards', () => {
    const { getByText, getAllByText } = render(<LoungeScreen />);

    expect(getByText('🎧 טרקלין סאונד מרחבי')).toBeTruthy();
    expect(getByText('🎵 בחרו מנגינת רקע סביבתית')).toBeTruthy();
    expect(getByText('🌌 קפסולות מצבי רוח וקריינות AI')).toBeTruthy();
    expect(getByText('מד״ב עתידני')).toBeTruthy();
  });

  it('handles playing and pausing soundtrack correctly', async () => {
    const { getByText, getByTestId } = render(<LoungeScreen />);
    
    // Initial status badge
    expect(getByText('מצב השמעה מושהה')).toBeTruthy();

    // Toggle play
    const playButton = getByTestId('play-pause-button');
    expect(playButton).toBeTruthy();

    await act(async () => {
      // First play call will trigger createAsync
      fireEvent.press(playButton);
    });

    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      { uri: expect.stringContaining('.mp3') },
      expect.objectContaining({ shouldPlay: true, isLooping: true })
    );
  });

  it('triggers AI atmosphere narrative generation and speak narration', async () => {
    const { getByText } = render(<LoungeScreen />);

    const generateBtn = getByText('צור אווירה קולנועית ב-AI');
    expect(generateBtn).toBeTruthy();

    await act(async () => {
      fireEvent.press(generateBtn);
    });

    // Verify AIService and expo-speech were called
    expect(AIService.generateAtmosphereNarrative).toHaveBeenCalled();
    expect(Speech.speak).toHaveBeenCalledWith(
      'טקסט אווירה מדהים שנוצר על ידי ה-AI.',
      expect.objectContaining({ language: 'he-IL' })
    );

    expect(getByText('טקסט אווירה מדהים שנוצר על ידי ה-AI.')).toBeTruthy();
  });

  it('should navigate back when the back button is clicked', () => {
    const { getByTestId } = render(<LoungeScreen />);
    
    const backBtn = getByTestId('back-button');
    expect(backBtn).toBeTruthy();

    fireEvent.press(backBtn);
    expect(router.back).toHaveBeenCalled();
  });
});
