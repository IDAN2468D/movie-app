/**
 * Maps screen names and Hebrew keywords to exact Expo Router paths.
 */
export const getRouteForScreen = (screenName: string): string => {
  const normalized = (screenName || '').toLowerCase().trim();

  switch (normalized) {
    case 'profile':
    case 'settings':
    case 'פרופיל':
    case 'הגדרות':
    case 'אזור אישי':
    case 'חשבון':
      return '/(tabs)/profile';

    case 'tickets':
    case 'orders':
    case 'כרטיסים':
    case 'כרטיסים שלי':
    case 'הכרטיסים שלי':
    case 'הזמנות':
      return '/(tabs)/tickets';

    case 'search':
    case 'explore':
    case 'חיפוש':
    case 'גילוי':
      return '/(tabs)/search';

    case 'watchlist':
    case 'saved':
    case 'רשימה':
    case 'רשימת צפייה':
    case 'הרשימה שלי':
      return '/(tabs)/watchlist';

    case 'home':
    case 'main':
    case 'index':
    case 'בית':
    case 'מסך הבית':
    case 'ראשי':
      return '/(tabs)';

    case 'scanner':
    case 'סורק':
    case 'סורק פוסטרים':
      return '/movie/scanner';

    case 'cinelens':
    case 'סינלנס':
      return '/search/cinelens';

    case 'map':
    case 'מפה':
    case 'מפת הקולנוע':
      return '/map';

    case 'arwayfinder':
    case 'wayfinder':
    case 'ניווט':
    case 'ניווט קולנועי':
      return '/arwayfinder';

    case 'auramatch':
    case 'cinematch':
    case 'התאמה':
      return '/auramatch';

    case 'cinesound':
    case 'sound':
    case 'audio':
    case 'סאונד':
    case 'אודיו':
      return '/cinesound';

    case 'squad':
    case 'cinesquad':
    case 'squadplanner':
    case 'סקוואד':
    case 'חברים':
    case 'קבוצה':
      return '/squadplanner';

    case 'snack':
    case 'snacks':
    case 'popcorn':
    case 'מזנון':
    case 'פופקורן':
    case 'חטיפים':
      return '/movie/snack-lab';

    case 'auction':
    case 'seatauction':
    case 'פומבית':
    case 'מכירה פומבית':
      return '/seatauction';

    case 'loyalty':
    case 'club':
    case 'מועדון':
    case 'נאמנות':
    case 'נקודות':
      return '/loyalty';

    case 'cinecollect':
    case 'cards':
    case 'אוסף':
    case 'קלפים':
      return '/cinecollect';

    case 'production':
    case 'productionlab':
    case 'הפקה':
      return '/productionlab';

    case 'cinequiz':
    case 'quiz':
    case 'חידון':
    case 'טריוויה':
      return '/cinequiz';

    case 'cinepredict':
    case 'predict':
    case 'תחזיות':
      return '/cinepredict';

    case 'friends':
      return '/friends';

    default:
      return '/(tabs)';
  }
};
