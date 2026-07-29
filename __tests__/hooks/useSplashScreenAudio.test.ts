import { renderHook, act } from '@testing-library/react-native';
import { useSplashScreenAudio } from '../../hooks/useSplashScreenAudio';
import { Audio } from '../../utils/safeExpoAv';

// Mock safeExpoAv
const mockSound = {
  loadAsync: jest.fn(),
  unloadAsync: jest.fn(() => Promise.resolve()),
  playAsync: jest.fn(() => Promise.resolve()),
  setOnPlaybackStatusUpdate: jest.fn(),
};

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('../../utils/safeExpoAv', () => {
  return {
    isAudioAvailable: true,
    Audio: {
      setAudioModeAsync: jest.fn(() => Promise.resolve()),
      Sound: {
        createAsync: jest.fn(() => Promise.resolve({ sound: mockSound, status: { isLoaded: true } })),
      },
    },
  };
});

describe('useSplashScreenAudio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should load and play splash screen audio on mount', async () => {
    renderHook(() => useSplashScreenAudio());

    // Flush microtasks for Audio.setAudioModeAsync and Audio.Sound.createAsync
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(Audio.setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        playsInSilentModeIOS: true,
      })
    );
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({ volume: 0.8, shouldPlay: false })
    );

    // Fast-forward timers for playAsync delay (250ms)
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Flush microtask queue after timeout callback executes
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSound.playAsync).toHaveBeenCalled();
  });

  it('should unload audio on unmount to prevent leaks', async () => {
    const { unmount } = renderHook(() => useSplashScreenAudio());

    // Flush microtasks for loading sequence
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    unmount();

    // Flush microtasks for unloading sequence
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSound.unloadAsync).toHaveBeenCalled();
  });
});
