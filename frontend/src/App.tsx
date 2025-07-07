import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/react-query';
import { router } from '@/router';
import { useAuthStore } from '@/stores/auth';
import { authService } from '@/services/auth';
import '@/index.css';

const AuthInitializer: React.FC = () => {
  const { isAuthenticated, setLoading } = useAuthStore();

  useEffect(() => {
    // If authenticated, try to fetch current user data on app initialization
    if (isAuthenticated) {
      setLoading(true);
      authService.getCurrentUser()
        .then((userData) => {
          useAuthStore.getState().setUser(userData);
        })
        .catch((error) => {
          console.error('Failed to fetch user data on app start:', error);
          // Don't logout on initial load error, the response interceptor will handle token issues
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isAuthenticated, setLoading]);

  return null;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      <RouterProvider router={router} />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            fontSize: '14px',
            maxWidth: '400px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
};

export default App;
