import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

const API_BASE_URL = 'https://cinebook-backend.onrender.com/api'; // Standard Render backend URL for project

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2, { message: 'שם התצוגה חייב להכיל לפחות 2 תווים' }),
  email: z.string().email({ message: 'כתובת אימייל אינה תקינה' }),
  password: z.string().min(6, { message: 'סיסמה חייבת להכיל לפחות 6 תווים' }).optional().or(z.literal('')),
});

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

export const pickImage = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permissionResult.granted === false) {
    throw new Error('נדרשת הרשאה לגישה לגלריית התמונות');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0];
  }
  return null;
};

export const uploadAvatar = async (imageUri: string): Promise<string> => {
  const token = await SecureStore.getItemAsync('user_token');
  if (!token) throw new Error('שגיאת אימות: אנא התחבר מחדש');

  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'avatar.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;

  formData.append('avatar', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      // FormData sets Content-Type boundary automatically
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('שגיאה בהעלאת התמונה');
  }

  const data = await response.json();
  return data.avatarUrl;
};

export const updateProfile = async (data: ProfileUpdateData): Promise<void> => {
  const token = await SecureStore.getItemAsync('user_token');
  if (!token) throw new Error('שגיאת אימות: אנא התחבר מחדש');

  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('שגיאה בעדכון הפרופיל');
  }
};
