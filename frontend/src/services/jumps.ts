import { api } from '@/lib/api';
import { Jump, Load } from '@/types';

export interface JumpStats {
  total_jumps: number;
  tandem_jumps: number;
  sport_jumps: number;
  aff_jumps: number;
}

export const jumpService = {
  // Get current user's jumps (logbook)
  getMyJumps: async (): Promise<Jump[]> => {
    const response = await api.get('/jumps/me');
    return response.data;
  },

  // Get current user's jump statistics
  getMyJumpStats: async (): Promise<JumpStats> => {
    const response = await api.get('/jumps/me/stats');
    return response.data;
  },

  // Get jump by ID
  getJump: async (jumpId: number): Promise<Jump> => {
    const response = await api.get(`/jumps/${jumpId}`);
    return response.data;
  },
};

export const loadService = {
  // Get loads with optional date filtering
  getLoads: async (startDate?: string, endDate?: string): Promise<Load[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get('/loads', { params });
    return response.data;
  },

  // Get load by ID
  getLoad: async (loadId: number): Promise<Load> => {
    const response = await api.get(`/loads/${loadId}`);
    return response.data;
  },

  // Get jumps in a load
  getLoadJumps: async (loadId: number): Promise<Jump[]> => {
    const response = await api.get(`/loads/${loadId}/jumps`);
    return response.data;
  },
};
