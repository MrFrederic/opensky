import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';
import { User } from '@/types';
import { queryKeys } from '@/lib/react-query';

/**
 * Hook to fetch and manage current user data
 */
export const useUser = () => {
  const { isAuthenticated, user, setUser, setLoading, fetchPermissions } = useAuthStore();

  // Query for fetching user data
  const query = useQuery<User>({
    queryKey: queryKeys.currentUser,
    queryFn: authService.getCurrentUser,
    enabled: isAuthenticated, // Only run if user is authenticated
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // When query is successful, update the user in the store and fetch permissions
  useEffect(() => {
    if (query.data) {
      setUser(query.data);
      fetchPermissions(); // Fetch permissions when user data is loaded
    }
  }, [query.data, setUser, fetchPermissions]);

  // Update loading state in the auth store
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(query.isLoading);
    }
  }, [query.isLoading, isAuthenticated, setLoading]);

  return {
    user,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};
