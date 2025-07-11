import { api } from '@/lib/api';
import { Load, LoadStatus, CreateLoadData, UpdateLoadData, LoadSpacesInfo } from '@/types';

export interface LoadListParams {
  skip?: number;
  limit?: number;
  aircraft_id?: number;
  departure_from?: string; // ISO datetime string
  departure_to?: string; // ISO datetime string
  status?: LoadStatus;
}

export const loadsService = {
  // Get all loads with optional filters
  getLoads: async (params: LoadListParams = {}): Promise<Load[]> => {
    const response = await api.get('/loads/', { params });
    return response.data;
  },

  // Get single load by ID
  getLoadById: async (id: number): Promise<Load> => {
    const response = await api.get(`/loads/${id}`);
    return response.data;
  },

  // Create new load (admin only)
  createLoad: async (data: CreateLoadData): Promise<Load> => {
    const response = await api.post('/loads/', data);
    return response.data;
  },

  // Update load basic information (admin only)
  updateLoad: async (id: number, data: UpdateLoadData): Promise<Load> => {
    const response = await api.put(`/loads/${id}`, data);
    return response.data;
  },

  // Update load status (admin only)
  updateLoadStatus: async (id: number, status: LoadStatus): Promise<Load> => {
    const response = await api.patch(`/loads/${id}/status`, { status });
    return response.data;
  },

  // Update reserved spaces (admin only)
  updateLoadSpaces: async (id: number, reserved_spaces: number): Promise<LoadSpacesInfo> => {
    const response = await api.patch(`/loads/${id}/spaces`, { reserved_spaces });
    return response.data;
  },

  // Delete load (admin only)
  deleteLoad: async (id: number): Promise<void> => {
    await api.delete(`/loads/${id}`);
  },
};
