import { View, Text, Pressable } from 'react-native';
import { Link, Stack } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center p-5 bg-background gap-4">
        <Text className="text-[64px] mb-5">🎬</Text>
        <Text className="text-h1 text-white text-center">Page not found</Text>
        <Link href="/" asChild>
          <Pressable className="mt-2 py-3.5 px-6 bg-primary rounded-2xl">
            <Text className="text-h3 text-background font-bold">Back to Home</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

// NativeWind migration complete - styles object removed
