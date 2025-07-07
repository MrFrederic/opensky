import { api } from '@/lib/api';
import { Dictionary, DictionaryValue } from '@/types';

export interface DictionariesListParams {
  skip?: number;
  limit?: number;
  name?: string;
  is_active?: boolean;
  is_system?: boolean;
}

export interface CreateDictionaryData {
  name: string;
}

export interface CreateDictionaryValueData {
  value: string;
}

export const dictionariesService = {
  // Get all dictionaries (with optional filtering)
  getDictionaries: async (params: DictionariesListParams = {}): Promise<Dictionary[]> => {
    const response = await api.get('/dictionaries/', { params });
    return response.data;
  },

  // Get specific dictionary by ID with all its values
  getDictionary: async (dictionaryId: number): Promise<Dictionary> => {
    const response = await api.get(`/dictionaries/${dictionaryId}`);
    return response.data;
  },

  // Create new dictionary
  createDictionary: async (data: CreateDictionaryData): Promise<Dictionary> => {
    const response = await api.post('/dictionaries/', data);
    return response.data;
  },

  // Update dictionary
  updateDictionary: async (dictionaryId: number, name: string): Promise<Dictionary> => {
    const response = await api.put(`/dictionaries/${dictionaryId}`, { name });
    return response.data;
  },

  // Delete dictionary (soft delete)
  deleteDictionary: async (dictionaryId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/dictionaries/${dictionaryId}`);
    return response.data;
  },

  // Dictionary value operations
  createDictionaryValue: async (dictionaryId: number, data: CreateDictionaryValueData): Promise<DictionaryValue> => {
    const response = await api.post(`/dictionaries/${dictionaryId}/values`, data);
    return response.data;
  },

  updateDictionaryValue: async (valueId: number, value: string): Promise<DictionaryValue> => {
    const response = await api.put(`/dictionaries/values/${valueId}`, { value });
    return response.data;
  },

  deleteDictionaryValue: async (valueId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/dictionaries/values/${valueId}`);
    return response.data;
  },

  getDictionaryValue: async (valueId: number): Promise<DictionaryValue> => {
    const response = await api.get(`/dictionaries/values/${valueId}`);
    return response.data;
  },
};
