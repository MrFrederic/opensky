import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens } from '@/types';

export type RegistrationStatus = 'pending' | 'completed' | 'required';
export type UserStatus = 'new' | 'existing' | 'incomplete';

interface AuthState {
  user: User | null;
  token: string | null;
  tempToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  registrationStatus: RegistrationStatus;
  userStatus: UserStatus | null;
  telegramUserData: any | null; // Store Telegram user data for pre-filling forms
}

interface AuthActions {
  setAuth: (user: User, tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setTempToken: (tempToken: string, userStatus: UserStatus, telegramUserData?: any) => void;
  clearTempToken: () => void;
  setRegistrationStatus: (status: RegistrationStatus) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // State
      user: null,
      token: null,
      tempToken: null,
      isAuthenticated: false,
      isLoading: false,
      registrationStatus: 'completed',
      userStatus: null,
      telegramUserData: null,

      // Actions
      setAuth: (user: User, tokens: AuthTokens) =>
        set({
          user,
          token: tokens.access_token,
          tempToken: null,
          userStatus: null,
          telegramUserData: null,
          isAuthenticated: true,
          isLoading: false,
          registrationStatus: 'completed',
        }),

      setUser: (user: User) =>
        set({ user }),

      setTokens: (tokens: AuthTokens) =>
        set({ 
          token: tokens.access_token,
          tempToken: null,
          userStatus: null,
          telegramUserData: null,
          isAuthenticated: true,
          isLoading: false,
          registrationStatus: 'completed',
        }),

      setTempToken: (tempToken: string, userStatus: UserStatus, telegramUserData?: any) =>
        set({
          tempToken,
          userStatus,
          telegramUserData: telegramUserData || null,
          token: null,
          user: null,
          isAuthenticated: false,
          registrationStatus: userStatus === 'existing' ? 'completed' : 'required',
        }),

      clearTempToken: () =>
        set({
          tempToken: null,
          userStatus: null,
          telegramUserData: null,
        }),

      setRegistrationStatus: (status: RegistrationStatus) =>
        set({ registrationStatus: status }),

      logout: () =>
        set({
          user: null,
          token: null,
          tempToken: null,
          userStatus: null,
          telegramUserData: null,
          isAuthenticated: false,
          isLoading: false,
          registrationStatus: 'completed',
        }),

      setLoading: (loading: boolean) =>
        set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        tempToken: state.tempToken,
        isAuthenticated: state.isAuthenticated,
        registrationStatus: state.registrationStatus,
        userStatus: state.userStatus,
        telegramUserData: state.telegramUserData,
      }),
    }
  )
);
