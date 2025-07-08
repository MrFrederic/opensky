import { useState, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  open: boolean;
}

interface ToastOptions {
  duration?: number;
}

/**
 * Hook for standardized toast notifications using Material UI Snackbar
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addToast = useCallback((message: string, severity: ToastMessage['severity'], options?: ToastOptions) => {
    const id = generateId();
    const newToast: ToastMessage = {
      id,
      message,
      severity,
      open: true,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto dismiss after specified duration
    setTimeout(() => {
      setToasts(prev => prev.map(toast => 
        toast.id === id ? { ...toast, open: false } : toast
      ));
      
      // Remove from array after animation
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 300);
    }, options?.duration || 4000);

    return id;
  }, []);

  const showSuccess = useCallback((message: string, options?: ToastOptions) => {
    return addToast(message, 'success', options);
  }, [addToast]);

  const showError = useCallback((message: string, error?: unknown, options?: ToastOptions) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const fullMessage = error ? `${message}: ${errorMessage}` : message;
    return addToast(fullMessage, 'error', options);
  }, [addToast]);

  const showInfo = useCallback((message: string, options?: ToastOptions) => {
    return addToast(message, 'info', options);
  }, [addToast]);

  const showWarning = useCallback((message: string, options?: ToastOptions) => {
    return addToast(message, 'warning', options);
  }, [addToast]);

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      setToasts(prev => prev.map(toast => 
        toast.id === toastId ? { ...toast, open: false } : toast
      ));
    } else {
      setToasts(prev => prev.map(toast => ({ ...toast, open: false })));
    }
  }, []);

  const closeToast = useCallback((toastId: string) => {
    setToasts(prev => prev.map(toast => 
      toast.id === toastId ? { ...toast, open: false } : toast
    ));
    
    // Remove from array after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== toastId));
    }, 300);
  }, []);

  return {
    toasts,
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
    dismiss,
    close: closeToast,
  };
};
