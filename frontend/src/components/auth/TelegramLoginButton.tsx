import React, { useEffect, useRef } from 'react';

interface TelegramLoginButtonProps {
  botUsername: string;
  buttonSize?: 'large' | 'medium' | 'small';
  onAuth: (user: any) => void;
  className?: string;
  dataRequestAccess?: string;
}

const TelegramLoginButton: React.FC<TelegramLoginButtonProps> = ({
  botUsername,
  buttonSize = 'large',
  onAuth,
  className = '',
  dataRequestAccess = 'write',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Skip if no bot username or container reference
    if (!botUsername || !containerRef.current) return;
    
    // Set up global callback for Telegram widget
    window.onTelegramAuth = onAuth;
    
    // Create script element to load Telegram widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', dataRequestAccess);
    
    // Add script to container
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);
    
    // Cleanup
    return () => {
      window.onTelegramAuth = () => {};
    };
  }, [botUsername, buttonSize, onAuth, dataRequestAccess]);
  
  if (!botUsername) return null;
  
  return <div ref={containerRef} className={className} />;
};

export default TelegramLoginButton;
