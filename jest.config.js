module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest-setup.js'],
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
  // setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native|nativewind)',
  ],
};
