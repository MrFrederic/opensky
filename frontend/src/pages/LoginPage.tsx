import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import { authService, TelegramAuthData } from '@/services/auth';
import TelegramLoginButton from '@/components/auth/TelegramLoginButton';

// Declare global TelegramLoginWidget type
declare global {
  interface Window {
    onTelegramAuth: (user: TelegramAuthData) => void;
  }
}

const LoginPage: React.FC = () => {
  const { isAuthenticated, setAuth, setTokens } = useAuthStore();
  const navigate = useNavigate();
  const [botUsername, setBotUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Get the Telegram bot username from API
    authService.getTelegramBotUsername()
      .then(response => setBotUsername(response.username))
      .catch(error => {
        console.error('Failed to get Telegram bot username:', error);
        toast.error('Failed to initialize login. Please refresh the page.');
      })
      .finally(() => setIsLoading(false));
  }, []);
  
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
      navigate('/');
    } catch (error) {
      console.error('Authentication failed:', error);
      toast.error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // If user is already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Main login container */}
      <div className="flex-1 flex flex-col">
        {/* Header - DZ Management */}
        <div className="w-full border-b border-gray-200 bg-white p-4">
          <h1 className="text-2xl font-bold text-gray-900">DZ Management</h1>
        </div>
        
        {/* Login content */}
        <div className="flex-1 flex">
          {/* Left side - welcome message */}
          <div className="w-1/2 p-8 flex flex-col justify-center border-r border-gray-200">
            <div className="max-w-md mx-auto">
              <h2 className="text-3xl font-bold mb-4">Welcome</h2>
              <p className="text-lg text-gray-700">
                Welcome to the Dropzone Management System. Login with your Telegram account to access the system and manage your skydiving activities.
              </p>
            </div>
          </div>
          
          {/* Right side - Telegram login */}
          <div className="w-1/2 p-8 flex flex-col justify-center items-center">
            <div className="max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
              
              {isLoading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <TelegramLoginButton 
                    botUsername={botUsername}
                    buttonSize="large" 
                    onAuth={handleTelegramAuth}
                    className="flex justify-center"
                  />
                  <p className="mt-4 text-sm text-gray-500">Click the button above to login with Telegram</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
