import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens } from '@/types';
import axios from 'axios';

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
  permissions: string[];
}

interface AuthActions {
  setAuth: (user: User, tokens: AuthTokens) => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setTempToken: (tempToken: string, userStatus: UserStatus, telegramUserData?: any) => void;
  clearTempToken: () => void;
  setRegistrationStatus: (status: RegistrationStatus) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (permission: string) => boolean;
  fetchPermissions: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      tempToken: null,
      isAuthenticated: false,
      isLoading: false,
      registrationStatus: 'completed',
      userStatus: null,
      telegramUserData: null,
      permissions: [],

      // Actions
      setAuth: async (user: User, tokens: AuthTokens) => {
        set({
          user,
          token: tokens.access_token,
          tempToken: null,
          userStatus: null,
          telegramUserData: null,
          isAuthenticated: true,
          isLoading: false,
          registrationStatus: 'completed',
        });
        
        // Fetch user permissions after setting auth
        await get().fetchPermissions();
      },

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
          permissions: [],
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
          permissions: [],
        }),

      setLoading: (loading: boolean) =>
        set({ isLoading: loading }),

      hasPermission: (permission: string) => {
        const { permissions } = get();
        return permissions.includes(permission);
      },

      fetchPermissions: async () => {
        try {
          const { token } = get();
          if (!token) {
            set({ permissions: [] });
            return;
          }
          
          const response = await axios.get('/api/v1/users/me/permissions', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          set({ permissions: response.data.permissions });
        } catch (error) {
          console.error('Failed to fetch permissions:', error);
          set({ permissions: [] });
        }
      },
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
        permissions: state.permissions,
      }),
    }
  )
);
