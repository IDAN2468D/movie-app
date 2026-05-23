import { create } from 'zustand';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

interface UserStore {
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  updateAvatar: (avatarUrl: string) => void;
  updateProfile: (displayName: string, email: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateAvatar: (avatarUrl) => set((state) => ({
    user: state.user ? { ...state.user, avatarUrl } : null
  })),
  updateProfile: (displayName, email) => set((state) => ({
    user: state.user ? { ...state.user, displayName, email } : null
  })),
  clearUser: () => set({ user: null })
}));

// Atomic selectors for performance
export const selectUser = (state: UserStore) => state.user;
export const selectUpdateAvatar = (state: UserStore) => state.updateAvatar;
export const selectUpdateProfile = (state: UserStore) => state.updateProfile;
