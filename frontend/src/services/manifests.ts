import { api } from '@/lib/api';
import { Manifest, CreateManifestRequest } from '@/types';

export const manifestService = {
  // Get current user's manifests
  getMyManifests: async (): Promise<Manifest[]> => {
    const response = await api.get('/manifests/me');
    return response.data;
  },

  // Create manifest
  createManifest: async (manifestData: CreateManifestRequest): Promise<Manifest> => {
    const response = await api.post('/manifests/', manifestData);
    return response.data;
  },

  // Get manifest by ID
  getManifest: async (manifestId: number): Promise<Manifest> => {
    const response = await api.get(`/manifests/${manifestId}`);
    return response.data;
  },

  // Update manifest
  updateManifest: async (manifestId: number, manifestData: Partial<Manifest>): Promise<Manifest> => {
    const response = await api.put(`/manifests/${manifestId}`, manifestData);
    return response.data;
  },

  // Delete manifest
  deleteManifest: async (manifestId: number): Promise<void> => {
    await api.delete(`/manifests/${manifestId}`);
  },
};
