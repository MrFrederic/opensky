import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from '@/theme';
import { queryClient } from '@/lib/react-query';
import { router } from '@/router';
import { useAuthStore } from '@/stores/auth';
import { authService } from '@/services/auth';
import { ToastProvider } from '@/components/common/ToastProvider';

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <AuthInitializer />
          <RouterProvider router={router} />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
