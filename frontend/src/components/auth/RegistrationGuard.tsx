import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

interface RequireRegistrationProps {
  children: React.ReactNode;
}

/**
 * Route guard that redirects to registration if user hasn't completed their profile
 */
export const RequireRegistration: React.FC<RequireRegistrationProps> = ({ children }) => {
  const { isAuthenticated, registrationStatus, tempToken } = useAuthStore();

  // If user has temp token, they need to complete registration
  if (tempToken && registrationStatus === 'required') {
    return <>{children}</>;
  }

  // If user is not authenticated or registration not required, redirect
  if (!isAuthenticated || registrationStatus !== 'required') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

interface RequireCompletedRegistrationProps {
  children: React.ReactNode;
}

/**
 * Route guard that redirects to registration completion if user hasn't finished their profile
 */
export const RequireCompletedRegistration: React.FC<RequireCompletedRegistrationProps> = ({ children }) => {
  const { isAuthenticated, registrationStatus, tempToken } = useAuthStore();

  // If user has temp token and needs registration, redirect to complete it
  if (tempToken && registrationStatus === 'required') {
    return <Navigate to="/registration/verify" replace />;
  }

  // If user is not authenticated, redirect to home
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If registration is completed, allow access
  if (registrationStatus === 'completed') {
    return <>{children}</>;
  }

  return <>{children}</>;
};
