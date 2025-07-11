import React, { createContext, useContext, ReactNode } from 'react';
import { Snackbar, Alert, Portal } from '@mui/material';
import { useToast, ToastMessage } from '@/hooks/useToast';

interface ToastContextType {
  success: (message: string, options?: { duration?: number }) => string;
  error: (message: string, error?: unknown, options?: { duration?: number }) => string;
  info: (message: string, options?: { duration?: number }) => string;
  warning: (message: string, options?: { duration?: number }) => string;
  dismiss: (toastId?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Portal>
        {toast.toasts.map((toastItem: ToastMessage) => (
          <Snackbar
            key={toastItem.id}
            open={toastItem.open}
            autoHideDuration={null} // We handle timing in the hook
            onClose={() => toast.close(toastItem.id)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ 
              mt: 2,
              zIndex: 9999,
              '& .MuiSnackbar-root': {
                zIndex: 9999
              }
            }}
          >
            <Alert
              onClose={() => toast.close(toastItem.id)}
              severity={toastItem.severity}
              variant="outlined"
              sx={{ 
                width: '100%',
                maxWidth: 400,
                backdropFilter: 'blur(8px)',
                backgroundColor: (theme) => {
                  const alpha = 0.9;
                  switch (toastItem.severity) {
                    case 'success':
                      return `${theme.palette.success.light}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
                    case 'error':
                      return `${theme.palette.error.light}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
                    case 'warning':
                      return `${theme.palette.warning.light}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
                    case 'info':
                      return `${theme.palette.info.light}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
                    default:
                      return `${theme.palette.grey[100]}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
                  }
                },
                border: (theme) => `1px solid ${
                  toastItem.severity === 'success' ? theme.palette.success.main :
                  toastItem.severity === 'error' ? theme.palette.error.main :
                  toastItem.severity === 'warning' ? theme.palette.warning.main :
                  toastItem.severity === 'info' ? theme.palette.info.main :
                  theme.palette.grey[300]
                }`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  color: (theme) => 
                    toastItem.severity === 'success' ? theme.palette.success.main :
                    toastItem.severity === 'error' ? theme.palette.error.main :
                    toastItem.severity === 'warning' ? theme.palette.warning.main :
                    toastItem.severity === 'info' ? theme.palette.info.main :
                    theme.palette.grey[600]
                },
                '& .MuiAlert-message': {
                  color: (theme) => theme.palette.text.primary,
                  fontWeight: 500
                },
                '& .MuiAlert-action': {
                  color: (theme) => theme.palette.text.secondary
                }
              }}
            >
              {toastItem.message}
            </Alert>
          </Snackbar>
        ))}
      </Portal>
    </ToastContext.Provider>
  );
};

export const useToastContext = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};
