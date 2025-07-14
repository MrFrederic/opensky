import { api } from '@/lib/api';
import { User, UserRole, Gender } from '@/types';

export interface UsersListParams {
  skip?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
}

export interface CreateUserData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  display_name?: string;
  date_of_birth?: string; // ISO date string
  username?: string;
  email?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  gender?: Gender;
  telegram_id?: string;
  roles?: UserRole[];
  photo_url?: string;
  medical_clearance_date?: string; // ISO date string
  medical_clearance_is_confirmed?: boolean;
  is_active?: boolean;
}

export interface UpdateUserData {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  display_name?: string;
  date_of_birth?: string; // ISO date string
  username?: string;
  email?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  gender?: Gender;
  photo_url?: string;
  medical_clearance_date?: string; // ISO date string
  medical_clearance_is_confirmed?: boolean;
  is_active?: boolean;
  roles?: UserRole[];
}

export const usersService = {
  // Get all users (with optional filtering and search)
  getUsers: async (params: UsersListParams = {}): Promise<User[]> => {
    const response = await api.get('/users/', { params });
    return response.data;
  },

  // Get specific user by ID
  getUser: async (userId: number): Promise<User> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Update user
  updateUser: async (userId: number, userData: UpdateUserData): Promise<User> => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Create new user
  createUser: async (userData: CreateUserData): Promise<User> => {
    const response = await api.post('/users/', userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/users/${userId}`);
  },
};
