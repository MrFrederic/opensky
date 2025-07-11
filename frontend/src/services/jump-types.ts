import { api } from '@/lib/api';
import { JumpType, UserRole } from '@/types';

export interface JumpTypesListParams {
  skip?: number;
  limit?: number;
  allowed_role?: UserRole;
  is_available?: boolean;
  search?: string;
}

export interface CreateJumpTypeData {
  name: string;
  short_name: string;
  description?: string;
  exit_altitude?: number;
  price?: number;
  is_available?: boolean;
  allowed_roles?: UserRole[];
  additional_staff?: Array<{
    staff_required_role: UserRole;
    staff_default_jump_type_id?: number;
  }>;
}

export interface UpdateJumpTypeData {
  name?: string;
  short_name?: string;
  description?: string;
  exit_altitude?: number;
  price?: number;
  is_available?: boolean;
  allowed_roles?: UserRole[];
  additional_staff?: Array<{
    staff_required_role: UserRole;
    staff_default_jump_type_id?: number;
  }>;
}

export const jumpTypesService = {
  // Get all jump types with optional filters
  getJumpTypes: async (params: JumpTypesListParams = {}): Promise<JumpType[]> => {
    const response = await api.get('/jump-types/', { params });
    return response.data;
  },

  // Get single jump type by ID
  getJumpType: async (id: number): Promise<JumpType> => {
    const response = await api.get(`/jump-types/${id}`);
    return response.data;
  },

  // Create new jump type (admin only)
  createJumpType: async (data: CreateJumpTypeData): Promise<JumpType> => {
    const response = await api.post('/jump-types/', data);
    return response.data;
  },

  // Update jump type (admin only)
  updateJumpType: async (id: number, data: UpdateJumpTypeData): Promise<JumpType> => {
    const response = await api.put(`/jump-types/${id}`, data);
    return response.data;
  },

  // Delete jump type (admin only)
  deleteJumpType: async (id: number): Promise<void> => {
    await api.delete(`/jump-types/${id}`);
  },
};
