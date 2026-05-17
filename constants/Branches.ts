export interface Branch {
  id: string;
  name: string;
  location: string;
  distance: string;
  image: string;
  features: string[];
  occupancy: number; // Percentage
  coords: {
    latitude: number;
    longitude: number;
  };
}

export const BRANCHES: Branch[] = [
  {
    id: '1',
    name: 'סינמקס פרימיום - תל אביב',
    location: 'דיזנגוף 50, תל אביב (סנטר)',
    distance: '0.8 ק"מ',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
    features: ['IMAX', 'VIP', 'Dolby Atmos', '4DX'],
    occupancy: 85,
    coords: { latitude: 32.0754, longitude: 34.7753 }
  },
  {
    id: '2',
    name: 'היכל הקולנוע - רמת אביב',
    location: 'קניון רמת אביב, תל אביב',
    distance: '4.2 ק"מ',
    image: 'https://images.unsplash.com/photo-1517604401830-d59979720c48?w=800&q=80',
    features: ['VIP', '4DX', 'ScreenX', 'GOLD'],
    occupancy: 42,
    coords: { latitude: 32.1158, longitude: 34.8014 }
  },
  {
    id: '3',
    name: 'סינפילה - מרינה הרצליה',
    location: 'מרינה הרצליה, הרצליה',
    distance: '12.5 ק"מ',
    image: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=800&q=80',
    features: ['ScreenX', 'VIP', 'Dolby Atmos'],
    occupancy: 15,
    coords: { latitude: 32.1624, longitude: 34.7958 }
  },
  {
    id: '4',
    name: 'סינמה סיטי - גלילות',
    location: 'מתחם גלילות, רמת השרון',
    distance: '6.5 ק"מ',
    image: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&q=80',
    features: ['IMAX', 'ScreenX', 'GOLD', 'VIP'],
    occupancy: 68,
    coords: { latitude: 32.1464, longitude: 34.8019 }
  },
  {
    id: '5',
    name: 'גלובוס מקס - פתח תקווה',
    location: 'הקניון הגדול, פתח תקווה',
    distance: '8.2 ק"מ',
    image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80',
    features: ['Dolby Atmos', 'VIP', '4DX'],
    occupancy: 30,
    coords: { latitude: 32.0917, longitude: 34.8643 }
  },
  {
    id: '6',
    name: 'סינמקס בוטיק - ירושלים',
    location: 'מתחם התחנה, ירושלים',
    distance: '65.2 ק"מ',
    image: 'https://images.unsplash.com/photo-1517732359359-51f709b419a8?w=800&q=80',
    features: ['VIP', 'Dolby Atmos'],
    occupancy: 55,
    coords: { latitude: 31.7683, longitude: 35.2137 }
  },
  {
    id: '7',
    name: 'סינמה פארק - ראשון לציון',
    location: 'יס פלנט, ראשון לציון',
    distance: '15.5 ק"מ',
    image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=800&q=80',
    features: ['IMAX', '4DX', 'ScreenX'],
    occupancy: 92,
    coords: { latitude: 31.9730, longitude: 34.7925 }
  },
  {
    id: '8',
    name: 'פלאנט - חיפה',
    location: 'גרנד קניון, חיפה',
    distance: '90.5 ק"מ',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
    features: ['IMAX', 'VIP', 'Dolby Atmos'],
    occupancy: 75,
    coords: { latitude: 32.7885, longitude: 35.0062 }
  },
  {
    id: '9',
    name: 'סינמה פרימיום - באר שבע',
    location: 'גרנד קניון, באר שבע',
    distance: '110.2 ק"מ',
    image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80',
    features: ['VIP', '4DX', 'ScreenX'],
    occupancy: 60,
    coords: { latitude: 31.2450, longitude: 34.7937 }
  },
  {
    id: '10',
    name: 'אילת בוטיק סינמה',
    location: 'אייס מול, אילת',
    distance: '350.0 ק"מ',
    image: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=800&q=80',
    features: ['VIP', 'Dolby Atmos'],
    occupancy: 88,
    coords: { latitude: 29.5524, longitude: 34.9626 }
  },
  {
    id: '11',
    name: 'סינמה סיטי - נתניה',
    location: 'עיר ימים, נתניה',
    distance: '32.1 ק"מ',
    image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=800&q=80',
    features: ['IMAX', 'VIP', 'GOLD'],
    occupancy: 50,
    coords: { latitude: 32.2815, longitude: 34.8465 }
  },
  {
    id: '12',
    name: 'גלובוס מקס - אשדוד',
    location: 'ביג פאשן, אשדוד',
    distance: '38.4 ק"מ',
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80',
    features: ['ScreenX', 'VIP', 'Dolby Atmos'],
    occupancy: 65,
    coords: { latitude: 31.7892, longitude: 34.6547 }
  },
  {
    id: '13',
    name: 'היכל הקולנוע - כפר סבא',
    location: 'מתחם ג\'י, כפר סבא',
    distance: '20.0 ק"מ',
    image: 'https://images.unsplash.com/photo-1543536448-d209d2d13a1c?w=800&q=80',
    features: ['Dolby Atmos', '4DX', 'VIP'],
    occupancy: 40,
    coords: { latitude: 32.1764, longitude: 34.9287 }
  },
  {
    id: '14',
    name: 'סינמה פארק - מודיעין',
    location: 'קניון עזריאלי, מודיעין',
    distance: '35.8 ק"מ',
    image: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800&q=80',
    features: ['IMAX', 'GOLD', 'ScreenX'],
    occupancy: 70,
    coords: { latitude: 31.8996, longitude: 35.0076 }
  },
  {
    id: '15',
    name: 'סינמקס פרימיום - חדרה',
    location: 'מול החוף וילג\', חדרה',
    distance: '45.0 ק"מ',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
    features: ['VIP', 'Dolby Atmos'],
    occupancy: 45,
    coords: { latitude: 32.4418, longitude: 34.8966 }
  },
  {
    id: '16',
    name: 'היכל הקולנוע - כרמיאל',
    location: 'חוצות כרמיאל, כרמיאל',
    distance: '120.5 ק"מ',
    image: 'https://images.unsplash.com/photo-1517604401830-d59979720c48?w=800&q=80',
    features: ['ScreenX', 'VIP'],
    occupancy: 35,
    coords: { latitude: 32.9150, longitude: 35.2982 }
  },
  {
    id: '17',
    name: 'פלאנט - רחובות',
    location: 'קניון רחובות, רחובות',
    distance: '22.0 ק"מ',
    image: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=800&q=80',
    features: ['IMAX', 'VIP', 'Dolby Atmos', '4DX'],
    occupancy: 80,
    coords: { latitude: 31.8953, longitude: 34.8105 }
  },
  {
    id: '18',
    name: 'סינמה פרימיום - חולון',
    location: 'מתחם לה פארק, חולון',
    distance: '11.0 ק"מ',
    image: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&q=80',
    features: ['VIP', '4DX'],
    occupancy: 62,
    coords: { latitude: 32.0158, longitude: 34.7874 }
  },
  {
    id: '19',
    name: 'גלובוס מקס - אשקלון',
    location: 'מרינה מול, אשקלון',
    distance: '52.3 ק"מ',
    image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80',
    features: ['Dolby Atmos', 'ScreenX'],
    occupancy: 48,
    coords: { latitude: 31.6811, longitude: 34.5574 }
  },
  {
    id: '20',
    name: 'סינמה סיטי - קריות',
    location: 'הקריון, קרית ביאליק',
    distance: '100.2 ק"מ',
    image: 'https://images.unsplash.com/photo-1517732359359-51f709b419a8?w=800&q=80',
    features: ['IMAX', 'GOLD', 'VIP', 'Dolby Atmos'],
    occupancy: 78,
    coords: { latitude: 32.8427, longitude: 35.0886 }
  },
  {
    id: '21',
    name: 'אואזיס - טבריה',
    location: 'טיילת יגאל אלון, טבריה',
    distance: '135.0 ק"מ',
    image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=800&q=80',
    features: ['VIP'],
    occupancy: 25,
    coords: { latitude: 32.7885, longitude: 35.5398 }
  }
];
