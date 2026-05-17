import 'react-native-gesture-handler/jestSetup';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 0,
    Medium: 1,
    Heavy: 2,
  },
  NotificationFeedbackType: {
    Success: 0,
    Warning: 1,
    Error: 2,
  },
}));

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    __esModule: true,
    default: {
      View: View,
      Text: View,
      Image: View,
      ScrollView: View,
      createAnimatedComponent: (cb) => cb,
    },
    useSharedValue: (val) => ({ value: val }),
    useAnimatedStyle: (cb) => cb(),
    useAnimatedProps: (cb) => cb(),
    withTiming: (toValue) => toValue,
    withSpring: (toValue) => toValue,
    withRepeat: (toValue) => toValue,
    withSequence: (...args) => args[0],
    withDelay: (delay, toValue) => toValue,
    interpolate: (val, input, output) => output[0],
    Extrapolate: { CLAMP: 'clamp', BEZIER: 'bezier' },
    FadeIn: { duration: () => ({ delay: () => ({ springify: () => ({}) }) }) },
    FadeOut: { duration: () => ({ delay: () => ({ springify: () => ({}) }) }) },
    FadeInUp: { duration: () => ({ delay: () => ({ springify: () => ({}) }) }) },
    FadeInDown: { duration: () => ({ delay: () => ({ springify: () => ({}) }) }) },
    SlideInRight: { duration: () => ({ delay: () => ({ springify: () => ({}) }) }) },
    Layout: { springify: () => ({}) },
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
  };
});

// Mock Worklets (needed for Reanimated 4)
jest.mock('react-native-worklets', () => ({
  Worklets: {
    createRunInJsFn: (fn) => fn,
    createRunInContextFn: (fn) => fn,
  },
}));

jest.mock('expo-blur', () => ({
  BlurView: ({ children }) => children,
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => () => {}),
      isFocused: () => true,
      dispatch: jest.fn(),
      canGoBack: () => true,
    }),
    useRoute: () => ({
      params: {},
    }),
    useNavigationState: () => ({}),
    useFocusEffect: (callback) => callback(),
    NavigationContainer: 'NavigationContainer',
  };
});

// Mock Expo Router
jest.mock('expo-router', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    dismiss: jest.fn(),
    setParams: jest.fn(),
    canGoBack: () => true,
  };

  return {
    router: mockRouter,
    useRouter: () => mockRouter,
    useLocalSearchParams: () => ({}),
    useGlobalSearchParams: () => ({}),
    usePathname: () => '/',
    useSegments: () => [],
    Link: 'Link',
    Stack: 'Stack',
    Tabs: 'Tabs',
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => () => {}),
      isFocused: () => true,
      dispatch: jest.fn(),
      canGoBack: () => true,
    }),
    useRootNavigationState: () => ({
      key: 'root',
      index: 0,
      routes: [],
    }),
  };
});


