import { api } from '@/lib/api';
import { AuthTokens, User } from '@/types';
import { useAuthStore } from '@/stores/auth';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
}

export const authService = {
  // Get Telegram bot username from environment variable
  getTelegramBotUsername: async (): Promise<{ username: string }> => {
    // Access the environment variable through import.meta.env
    // Will be replaced at build time with the actual value
    const username = import.meta.env.TELEGRAM_BOT_USERNAME || '';
    return { username: username.replace('@', '') };
  },

  // Authenticate with Telegram
  authenticateWithTelegram: async (telegramData: TelegramAuthData): Promise<AuthTokens> => {
    const response = await api.post('/auth/telegram-auth', telegramData);
    return response.data;
  },

  // Refresh authentication token
  refreshToken: async (): Promise<AuthTokens> => {
    const response = await api.post('/auth/refresh');
    
    // Update the auth store with the new token
    const store = useAuthStore.getState();
    if (store.user) {
      store.setTokens(response.data);
    }
    
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Update current user
  updateCurrentUser: async (userData: Partial<User>): Promise<User> => {
    const response = await api.put('/users/me', userData);
    return response.data;
  },

  // Request sportsman status
  requestSportsmanStatus: async (): Promise<{ message: string }> => {
    const response = await api.post('/users/me/request-sportsman-status');
    return response.data;
  },

  // Logout (clears refresh token cookie)
  logout: async (): Promise<{ detail: string }> => {
    const response = await api.post('/auth/logout');
    
    // Clear the auth store
    const store = useAuthStore.getState();
    store.logout();
    
    return response.data;
  },

  // Logout from all devices
  logoutAllDevices: async (): Promise<{ detail: string }> => {
    const response = await api.post('/auth/logout-all');
    
    // Clear the auth store
    const store = useAuthStore.getState();
    store.logout();
    
    return response.data;
  },
};
