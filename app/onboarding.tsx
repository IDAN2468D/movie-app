/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { SlideInRight, SlideOutLeft, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Get window dimensions if needed, otherwise ignore if unused

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { 
    currentStep, 
    step, 
    handleNext, 
    handleSkip, 
    ONBOARDING_STEPS 
  } = useOnboarding();

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

      <View 
        className="flex-1 z-10 px-6"
        style={{ 
          paddingTop: insets.top + 20, 
          paddingBottom: Math.max(insets.bottom + 48, 68) 
        }}
      >
        {/* Skip button */}
        <View className="flex-row justify-end">
          <TouchableOpacity testID="onboarding-skip-button" onPress={handleSkip}>
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

            <Text testID="onboarding-step-title" className="text-3xl font-display-secondary text-white text-center mb-4">
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
            testID="onboarding-next-button"
            onPress={handleNext}
            className="w-16 h-16 rounded-full bg-primary items-center justify-center shadow-lg" style={{ shadowColor: Colors.primary, shadowOpacity: 0.3 }}
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
