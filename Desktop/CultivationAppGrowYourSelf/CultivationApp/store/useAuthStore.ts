import { create } from 'zustand';

export interface UserProfile {
  fullName: string;
  email: string;
  birthDate: string;
  profilePictureUrl?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  user: UserProfile | null;
  login: (user?: UserProfile) => void;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
  setAuthLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isAuthLoading: true,
  user: null,
  login: (user) => set({ isAuthenticated: true, user: user ?? null, isAuthLoading: false }),
  logout: () => set({ isAuthenticated: false, user: null, isAuthLoading: false }),
  updateUser: (data) => set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
}));
