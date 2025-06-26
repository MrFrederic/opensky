import { api } from '@/lib/api';
import { AuthTokens, User } from '@/types';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export const authService = {
  // Authenticate with Telegram
  authenticateWithTelegram: async (telegramData: TelegramAuthData): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await api.post('/auth/telegram-auth', telegramData);
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
};
