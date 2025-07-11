import { api } from '@/lib/api';
import { Aircraft, AircraftType } from '@/types';

export interface AircraftListParams {
  skip?: number;
  limit?: number;
  aircraft_type?: AircraftType;
  search?: string;
}

export interface CreateAircraftData {
  name: string;
  type: AircraftType;
  max_load: number;
}

export interface UpdateAircraftData {
  name?: string;
  type?: AircraftType;
  max_load?: number;
}

export const aircraftService = {
  // Get all aircraft with optional filters
  getAircraft: async (params: AircraftListParams = {}): Promise<Aircraft[]> => {
    const response = await api.get('/aircraft/', { params });
    return response.data;
  },

  // Get single aircraft by ID
  getAircraftById: async (id: number): Promise<Aircraft> => {
    const response = await api.get(`/aircraft/${id}`);
    return response.data;
  },

  // Create new aircraft (admin only)
  createAircraft: async (data: CreateAircraftData): Promise<Aircraft> => {
    const response = await api.post('/aircraft/', data);
    return response.data;
  },

  // Update aircraft (admin only)
  updateAircraft: async (id: number, data: UpdateAircraftData): Promise<Aircraft> => {
    const response = await api.put(`/aircraft/${id}`, data);
    return response.data;
  },

  // Delete aircraft (admin only)
  deleteAircraft: async (id: number): Promise<void> => {
    await api.delete(`/aircraft/${id}`);
  },
};
