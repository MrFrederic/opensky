import { api } from '@/lib/api';
import { AuthTokens, User, Gender } from '@/types';
import { useAuthStore, UserStatus } from '@/stores/auth';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramVerificationResponse {
  temp_token: string;
  user_status: UserStatus;
  expires_in: number;
  user_data?: any;
}

export interface RegistrationCompleteRequest {
  temp_token: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  display_name?: string;
  date_of_birth?: string;
  username?: string;
  email?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  gender?: Gender;
  photo_url?: string;
  medical_clearance_date?: string;
  starting_number_of_jumps?: number;
  roles?: string[];
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
}

export interface UpdateCurrentUserData {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  display_name?: string;
  username?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string; // ISO date string
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  gender?: Gender;
  photo_url?: string;
  medical_clearance_date?: string; // ISO date string
}

export const authService = {
  // Get Telegram bot username from backend configuration
  getTelegramBotUsername: async (): Promise<{ username: string }> => {
    try {
      const response = await api.get('/config/config');
      const username = response.data.telegram_bot_username || '';
      return { username: username.replace('@', '') };
    } catch (error) {
      console.error('Failed to fetch Telegram bot username:', error);
      return { username: '' };
    }
  },

  // NEW: Verify Telegram authentication and get temp token
  verifyTelegramAuth: async (telegramData: TelegramAuthData): Promise<TelegramVerificationResponse> => {
    const response = await api.post('/auth/telegram-verify', telegramData);
    return response.data;
  },

  // NEW: Complete registration with temp token
  completeRegistration: async (registrationData: RegistrationCompleteRequest): Promise<AuthTokens> => {
    const response = await api.post('/auth/complete-registration', registrationData);
    return response.data;
  },

  // NEW: Exchange temp token for full access
  exchangeToken: async (tempToken: string): Promise<AuthTokens> => {
    const response = await api.post('/auth/exchange-token', { temp_token: tempToken });
    return response.data;
  },

  // NEW: Check registration status
  checkRegistrationStatus: async (): Promise<{ registration_required: boolean; user_status: UserStatus; missing_fields?: string[] }> => {
    const response = await api.get('/auth/registration-status');
    return response.data;
  },

  // LEGACY: Authenticate with Telegram (deprecated)
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
  updateCurrentUser: async (userData: UpdateCurrentUserData): Promise<User> => {
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
