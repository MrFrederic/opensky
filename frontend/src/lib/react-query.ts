import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
    mutations: {
      retry: false,
    },
  },
});

// Query Keys
export const queryKeys = {
  // Auth
  currentUser: ['currentUser'],

  // Tandems
  tandemSlots: (startDate: string, endDate: string) => ['tandemSlots', startDate, endDate],
  myTandemBookings: ['myTandemBookings'],

  // Manifests
  myManifests: ['myManifests'],
  manifest: (id: number) => ['manifest', id],

  // Jumps & Loads
  myJumps: ['myJumps'],
  myJumpStats: ['myJumpStats'],
  loads: (startDate?: string, endDate?: string) => ['loads', startDate, endDate],
  load: (id: number) => ['load', id],
  loadJumps: (loadId: number) => ['loadJumps', loadId],

  // Equipment
  availableEquipment: ['availableEquipment'],
  equipment: (id: number) => ['equipment', id],

  // Dictionaries
  dictionaryValues: (dictionaryName: string) => ['dictionaryValues', dictionaryName],

  // Users (Admin)
  users: (role?: string) => ['users', role],
  usersSearch: (query: string) => ['users', 'search', query],
  user: (id: number) => ['user', id],
};
