import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { SlideInRight, SlideOutLeft, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/constants/Theme';

// Get window dimensions if needed, otherwise ignore if unused

const ONBOARDING_STEPS = [
  {
    id: '1',
    title: 'חוויה קולנועית חדשה',
    description: 'גלה את הסרטים החמים ביותר, צפה בטריילרים, והזמן כרטיסים בקלות ובמהירות.',
    icon: 'film-outline' as const,
  },
  {
    id: '2',
    title: 'בחירת מושבים חכמה',
    description: 'בחר את המושבים המועדפים עליך באולם הקולנוע בצורה חזותית ונוחה.',
    icon: 'apps-outline' as const,
  },
  {
    id: '3',
    title: 'הכל נשמר בשבילך',
    description: 'היסטוריית ההזמנות, הסרטים המועדפים, והכרטיסים שלך במקום אחד נגיש תמיד.',
    icon: 'bookmark-outline' as const,
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);

  const handleNext = async () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      console.log('Onboarding complete, routing to Login');
      await completeOnboarding();
      router.replace('/login');
    }
  };

  const handleSkip = async () => {
    console.log('Onboarding skipped, routing to Login');
    await completeOnboarding();
    router.replace('/login');
  };

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <View className="flex-1 bg-black">
      {/* Background elements */}
      <View className="absolute inset-0 z-0">
        <LinearGradient
          colors={[Colors.background, '#1a1a2e', Colors.background]}
          className="flex-1"
        />
        <View className="absolute top-1/4 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
        <View className="absolute bottom-1/4 -left-20 w-72 h-72 rounded-full bg-blue-600/20 blur-3xl" />
      </View>

      <View className="flex-1 z-10 pt-20 pb-12 px-6">
        {/* Skip button */}
        <View className="flex-row justify-end">
          <TouchableOpacity onPress={handleSkip}>
            <Text className="text-white/60 font-body text-base">דלג</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 justify-center items-center">
          <Animated.View
            key={step.id}
            entering={SlideInRight.duration(500).springify()}
            exiting={SlideOutLeft.duration(300)}
            layout={Layout.springify()}
            className="items-center w-full"
          >
            <View className="w-40 h-40 rounded-full bg-white/5 items-center justify-center mb-10 border border-white/10 shadow-2xl overflow-hidden">
              <View className="absolute inset-0 bg-white/5" />
              <Ionicons name={step.icon} size={80} color={Colors.primary} />
            </View>

            <Text className="text-3xl font-display-secondary text-white text-center mb-4">
              {step.title}
            </Text>
            
            <Text className="text-lg font-body text-white/70 text-center leading-7 px-4">
              {step.description}
            </Text>
          </Animated.View>
        </View>

        {/* Footer controls */}
        <View className="flex-row items-center justify-between mt-auto">
          {/* Pagination dots */}
          <View className="flex-row gap-2">
            {ONBOARDING_STEPS.map((_, index) => (
              <Animated.View
                key={index}
                className={`h-2 rounded-full ${index === currentStep ? 'w-8 bg-primary' : 'w-2 bg-white/20'}`}
                layout={Layout.springify()}
              />
            ))}
          </View>

          {/* Next/Start button */}
          <TouchableOpacity
            onPress={handleNext}
            className="w-16 h-16 rounded-full bg-primary items-center justify-center shadow-lg shadow-primary/30"
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
