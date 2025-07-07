import { api } from '@/lib/api';
import { User, UserRole } from '@/types';

export interface UsersListParams {
  skip?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  username?: string;
  email?: string;
  phone?: string;
  telegram_id: string;
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
  updateUser: async (userId: number, userData: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Update user roles
  updateUserRoles: async (userId: number, roles: UserRole[]): Promise<User> => {
    const response = await api.put(`/users/${userId}/roles`, { roles });
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
  }
};
