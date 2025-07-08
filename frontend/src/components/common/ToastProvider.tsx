import React, { createContext, useContext, ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';
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
      {toast.toasts.map((toastItem: ToastMessage) => (
        <Snackbar
          key={toastItem.id}
          open={toastItem.open}
          autoHideDuration={null} // We handle timing in the hook
          onClose={() => toast.close(toastItem.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: 2 }}
        >
          <Alert
            onClose={() => toast.close(toastItem.id)}
            severity={toastItem.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {toastItem.message}
          </Alert>
        </Snackbar>
      ))}
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
