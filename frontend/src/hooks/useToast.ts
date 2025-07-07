import toast from 'react-hot-toast';

interface ToastOptions {
  duration?: number;
}

/**
 * Hook for standardized toast notifications across the application
 */
export const useToast = () => {
  const showSuccess = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: options?.duration || 3000,
    });
  };

  const showError = (message: string, error?: unknown, options?: ToastOptions) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const fullMessage = error ? `${message}: ${errorMessage}` : message;
    
    toast.error(fullMessage, {
      duration: options?.duration || 4000,
    });
  };

  const showInfo = (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: options?.duration || 3000,
      icon: 'ℹ️',
    });
  };

  const showLoading = (message: string) => {
    return toast.loading(message);
  };

  const dismiss = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  return {
    success: showSuccess,
    error: showError,
    info: showInfo,
    loading: showLoading,
    dismiss,
  };
};
