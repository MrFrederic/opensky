import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth';

// Get API base URL - use relative path to leverage Vite's proxy in development
const getApiBaseUrl = (): string => {
  // Vite's proxy is configured to forward '/api' requests to the backend
  // So we must keep the '/api' prefix in the URL
  return '/api/v1';
};

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag to prevent multiple refresh attempts at once
let isRefreshing = false;
// Store pending requests
let failedQueue: { resolve: Function; reject: Function; }[] = [];

// Process pending requests after refresh
const processQueue = (error: any | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Global error handling for certain status codes
    if (error.response?.status === 500) {
      // Server errors should be logged for debugging
      console.error('Server error occurred:', error.response.data);
    }
    
    // If the error is 401 and not a refresh token request
    if (error.response?.status === 401 && 
        originalRequest && 
        originalRequest.url !== '/auth/refresh') {
      
      // Check if request doesn't need token or if user is not authenticated
      if (!useAuthStore.getState().isAuthenticated || 
          (originalRequest.url?.endsWith('/auth/telegram-auth'))) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If refresh is in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;
      
      // Try to refresh the token
      try {
        // Import here to avoid circular dependency
        const { authService } = await import('@/services/auth');
        const tokens = await authService.refreshToken();
        
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${tokens.access_token}`;
        }
        processQueue(null, tokens.access_token);
        
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout and reject all queued requests
        console.warn('Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        
        // Use auth service logout to properly clear refresh token
        try {
          const { authService } = await import('@/services/auth');
          await authService.logout();
        } catch (logoutError) {
          // If logout fails, at least clear local state
          console.warn('Logout failed during token refresh:', logoutError);
          useAuthStore.getState().logout();
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // For other errors just reject the promise
    return Promise.reject(error);
  }
);

export { api };
export default api;
