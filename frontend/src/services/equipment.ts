import { api } from '@/lib/api';
import { Equipment, DictionaryValue } from '@/types';

export const equipmentService = {
  // Get available equipment for manifesting
  getAvailableEquipment: async (): Promise<Equipment[]> => {
    const response = await api.get('/equipment/available');
    return response.data;
  },

  // Get equipment by ID
  getEquipment: async (equipmentId: number): Promise<Equipment> => {
    const response = await api.get(`/equipment/${equipmentId}`);
    return response.data;
  },
};

export const dictionaryService = {
  // Get dictionary values by dictionary name
  getDictionaryValues: async (dictionaryName: string): Promise<DictionaryValue[]> => {
    const response = await api.get(`/dictionaries/by-name/${dictionaryName}/values`);
    return response.data;
  },

  // Get specific dictionary value
  getDictionaryValue: async (valueId: number): Promise<DictionaryValue> => {
    const response = await api.get(`/dictionaries/values/${valueId}`);
    return response.data;
  },
};
