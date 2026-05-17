import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';

export const ONBOARDING_STEPS = [
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

export const useOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
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

  return {
    currentStep,
    step,
    handleNext,
    handleSkip,
    ONBOARDING_STEPS,
  };
};
