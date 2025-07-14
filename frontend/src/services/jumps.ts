import { api } from '@/lib/api';

export interface Jump {
  id: number;
  user_id: number;
  jump_type_id: number;
  is_manifested: boolean;
  load_id?: number;
  reserved?: boolean;
  comment?: string;
  parent_jump_id?: number;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    display_name?: string;
  };
  jump_type?: {
    id: number;
    name: string;
    short_name: string;
    additional_staff: Array<{
      staff_required_role: string;
      staff_default_jump_type_id?: number;
    }>;
  };
  load?: {
    id: number;
    departure: string;
  };
  parent_jump?: Jump;
  child_jumps: Jump[];
  created_at: string;
  updated_at?: string;
}

export interface CreateJumpData {
  user_id: number;
  jump_type_id: number;
  comment?: string;
  parent_jump_id?: number;
}

export interface UpdateJumpData {
  user_id?: number;
  jump_type_id?: number;
  is_manifested?: boolean;
  reserved?: boolean;
  comment?: string;
  parent_jump_id?: number;
}

export interface JumpLoadAssignment {
  jump_id: number;
  reserved?: boolean;
  staff_assignments?: Record<string, number>;
}

export interface JumpLoadAssignmentResponse {
  success: boolean;
  message: string;
  warning?: string;
  assigned_jump_ids: number[];
}

export interface JumpLoadRemovalResponse {
  success: boolean;
  message: string;
  removed_jump_ids: number[];
}

export interface GetJumpsParams {
  user_id?: number;
  jump_type_id?: number;
  is_manifested?: boolean;
  load_id?: number;
  parent_jump_id?: number;
  has_parent?: boolean;
  has_load?: boolean;
  skip?: number;
  limit?: number;
}

class JumpsService {
  async getJumps(params?: GetJumpsParams): Promise<Jump[]> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const response = await api.get(`/jumps?${searchParams.toString()}`);
    return response.data;
  }

  async getJump(id: number): Promise<Jump> {
    const response = await api.get(`/jumps/${id}`);
    return response.data;
  }

  async createJump(data: CreateJumpData): Promise<Jump> {
    const response = await api.post('/jumps', data);
    return response.data;
  }

  async updateJump(id: number, data: UpdateJumpData): Promise<Jump> {
    const response = await api.put(`/jumps/${id}`, data);
    return response.data;
  }

  async deleteJump(id: number): Promise<void> {
    await api.delete(`/jumps/${id}`);
  }

  async assignJumpToLoad(
    jumpId: number, 
    loadId: number, 
    assignment: JumpLoadAssignment
  ): Promise<JumpLoadAssignmentResponse> {
    const response = await api.post(`/jumps/${jumpId}/assign-to-load/${loadId}`, assignment);
    return response.data;
  }

  async removeJumpFromLoad(jumpId: number): Promise<JumpLoadRemovalResponse> {
    const response = await api.post(`/jumps/${jumpId}/remove-from-load`);
    return response.data;
  }

  async getLoadJumps(loadId: number): Promise<Jump[]> {
    const response = await api.get(`/jumps/load/${loadId}`);
    return response.data;
  }
}

export const jumpsService = new JumpsService();
