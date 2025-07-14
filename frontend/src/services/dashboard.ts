import { api } from '@/lib/api';
import { DashboardLoad } from '@/types';

export const dashboardService = {
  getDashboard: async (): Promise<DashboardLoad[]> => {
    const response = await api.get('/dashboard');
    return response.data;
  },
};
