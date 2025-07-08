import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Box,
  CircularProgress,
  Typography,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAuthStore } from '@/stores/auth';
import { authService, TelegramAuthData } from '@/services/auth';
import { useToastContext } from '@/components/common/ToastProvider';
import TelegramLoginButton from './TelegramLoginButton';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

// Declare global TelegramLoginWidget type
declare global {
  interface Window {
    onTelegramAuth: (user: TelegramAuthData) => void;
  }
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose }) => {
  const { setAuth, setTokens } = useAuthStore();
  const toast = useToastContext();
  const [botUsername, setBotUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (open) {
      // Get the Telegram bot username from API when modal opens
      setIsLoading(true);
      authService.getTelegramBotUsername()
        .then(response => setBotUsername(response.username))
        .catch(error => {
          console.error('Failed to get Telegram bot username:', error);
          toast.error('Failed to initialize login. Please try again.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, toast]);
  
  // Handle successful Telegram authentication
  const handleTelegramAuth = async (user: TelegramAuthData) => {
    try {
      // First, authenticate and get tokens
      const tokens = await authService.authenticateWithTelegram(user);
      
      // Set the tokens first so the API interceptor can use them for the next request
      setTokens(tokens);
      
      // Get user data using the token
      const userData = await authService.getCurrentUser();
      
      // Update authentication state with the real user data
      setAuth(userData, tokens);
      toast.success('Successfully logged in!');
      onClose();
    } catch (error) {
      console.error('Authentication failed:', error);
      toast.error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="div" fontWeight="bold">
            Login to DZ Management
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          Use your Telegram account to securely access the Dropzone Management System.
        </DialogContentText>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
            <TelegramLoginButton 
              botUsername={botUsername}
              buttonSize="large" 
              onAuth={handleTelegramAuth}
            />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              align="center" 
              sx={{ mt: 2 }}
            >
              Click the button above to login with Telegram
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
