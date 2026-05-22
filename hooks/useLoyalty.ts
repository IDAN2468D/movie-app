/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useRef, useCallback } from 'react';
import { ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/useAuthStore';
import { useHaptics } from '@/lib/useHaptics';

export const REWARDS = [
  { id: '1', title: 'פופקורן חינם', points: 150, description: 'פופקורן בגודל רגיל בכל רכישת כרטיס', icon: 'Gift', color: '#FFD700' },
  { id: '2', title: 'כרטיס שני ב-50%', points: 300, description: 'הנחה על הכרטיס השני בהזמנה אחת', icon: 'Star', color: '#E50914' },
  { id: '3', title: 'שדרוג ל-VIP', points: 500, description: 'שדרוג חינם לאולם ה-VIP על בסיס מקום פנוי', icon: 'Trophy', color: '#D4AF37' },
  { id: '4', title: 'מארז משפחתי', points: 800, description: '4 כרטיסים + 2 פופקורן + 4 שתייה', icon: 'Zap', color: '#00D1FF' },
];

export const TROPHIES = [
  { id: 't1', name: 'צופה מתחיל', description: 'צפית בסרט הראשון שלך ב-CineBook', color: '#00D1FF' },
  { id: 't2', name: 'מנשנש מקצועי', description: 'רכשת נשנוש טעים לחוויה', color: '#FFD700' },
  { id: 't3', name: 'חבר זהב', description: 'צברת 300 נקודות מועדון או יותר', color: '#FF8A00' },
  { id: 't4', name: 'מאסטר קולנוע', description: 'צפית ב-3 סרטים ומעלה או 500 נקודות', color: '#E50914' },
];

export const useLoyalty = () => {
  const { user } = useProfile();
  const { redeemReward } = useAuthStore();
  const haptics = useHaptics();
  const [showMemberCard, setShowMemberCard] = useState(false);
  const [showAllRewards, setShowAllRewards] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [activityY, setActivityY] = useState<number | null>(null);

  const points = user?.loyaltyPoints || 0;

  let currentTier = 'חבר כסף';
  let nextTier = 'חבר זהב';
  let pointsRemaining = 300 - points;
  let progressPercent = Math.min((points / 300) * 100, 100);

  if (points >= 300 && points < 500) {
    currentTier = 'חבר זהב'; nextTier = 'חבר פלטינה';
    pointsRemaining = 500 - points;
    progressPercent = Math.min(((points - 300) / 200) * 100, 100);
  } else if (points >= 500) {
    currentTier = 'חבר פלטינה'; nextTier = 'מאסטר';
    pointsRemaining = 0; progressPercent = 100;
  }

  const activities = user?.loyaltyActivity && user.loyaltyActivity.length > 0
    ? [...user.loyaltyActivity].reverse()
    : [{ action: 'בונוס הצטרפות', points: '+100', date: new Date().toISOString() }];

  const formatDate = (dateStr: any) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch { return dateStr; }
  };

  const handleRedeem = (reward: any) => {
    if (points < reward.points) {
      haptics.warning();
      Alert.alert('אין מספיק נקודות', 'צבור עוד נקודות על ידי רכישת כרטיסים ונשנושים בקולנוע!');
      return;
    }
    Alert.alert('מימוש הטבה', `האם ברצונך לממש את ההטבה: ${reward.title} תמורת ${reward.points} נקודות?`, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מימוש', onPress: async () => {
        try {
          const res = await redeemReward(reward.title, reward.points);
          if (res.success) { haptics.success(); Alert.alert('ההטבה מומשה בהצלחה!', 'קוד הקופון נשלח אליך למייל ומופיע באזור האישי.'); }
          else { haptics.error(); Alert.alert('שגיאה', res.message || 'לא ניתן לממש את ההטבה כעת'); }
        } catch { haptics.error(); Alert.alert('שגיאה', 'שגיאת חיבור לשרת'); }
      }},
    ]);
  };

  const scrollToHistory = () => {
    if (scrollRef.current && activityY !== null) {
      scrollRef.current.scrollTo({ y: activityY - 100, animated: true });
    }
  };

  const handleSetActivityY = (y: number) => setActivityY(y);
  const goBack = () => router.back();

  return {
    user, points, currentTier, nextTier, pointsRemaining, progressPercent,
    activities, showMemberCard, setShowMemberCard, showAllRewards, setShowAllRewards,
    scrollRef, formatDate, handleRedeem, scrollToHistory, handleSetActivityY, goBack,
  };
};
