import { visionService } from '../../services/VisionService';
import * as FileSystem from 'expo-file-system/legacy';
import { AIService } from '../../services/AIService';
import * as tmdb from '../../lib/tmdb';

// Mock expo-file-system/legacy
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve('mock_base64_data')),
  EncodingType: {
    Base64: 'base64',
  },
}));

// Mock AIService
jest.mock('../../services/AIService', () => ({
  AIService: {
    identifyMovieFromPoster: jest.fn(),
  },
}));

// Mock tmdb lib
jest.mock('../../lib/tmdb', () => ({
  searchMovies: jest.fn(),
  getNowPlaying: jest.fn(),
}));

describe('VisionService', () => {
  let originalApiKey: string | undefined;

  beforeAll(() => {
    originalApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    console.log('DEBUG: FileSystem mock in test:', FileSystem);
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    } else {
      process.env.EXPO_PUBLIC_GEMINI_API_KEY = originalApiKey;
    }
  });

  it('should identify poster using Gemini Vision API on success', async () => {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'mock_api_key';
    
    // Mock successful Gemini response
    (AIService.identifyMovieFromPoster as jest.Mock).mockResolvedValueOnce('Inception');
    
    // Mock TMDB search response
    (tmdb.searchMovies as jest.Mock).mockResolvedValueOnce([
      { id: 27205, title: 'Inception' }
    ]);

    const result = await visionService.identifyPoster('file://test_image.jpg');

    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith('file://test_image.jpg', {
      encoding: 'base64',
    });
    expect(AIService.identifyMovieFromPoster).toHaveBeenCalledWith('mock_base64_data');
    expect(tmdb.searchMovies).toHaveBeenCalledWith('Inception');
    expect(result).toEqual({
      success: true,
      movieId: 27205,
      movieTitle: 'Inception',
    });
  });

  it('should fallback to smart dynamic movie selection if Gemini API key is missing', async () => {
    delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    // Mock active listing movies in TMDB
    (tmdb.getNowPlaying as jest.Mock).mockResolvedValueOnce([
      { id: 550, title: 'Fight Club' },
      { id: 603, title: 'The Matrix' },
    ]);

    const result = await visionService.identifyPoster('file://test_image.jpg');

    expect(tmdb.getNowPlaying).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(['Fight Club', 'The Matrix']).toContain(result.movieTitle);
    expect([550, 603]).toContain(result.movieId);
  });

  it('should fallback to hard default movie if both Gemini and TMDB nowPlaying fail', async () => {
    delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    (tmdb.getNowPlaying as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

    const result = await visionService.identifyPoster('file://test_image.jpg');

    expect(result).toEqual({
      success: true,
      movieId: 299534,
      movieTitle: 'Avengers: Endgame',
    });
  });
});
