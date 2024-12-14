import { useEffect, useState } from 'react';
import { TelegramWebApp } from '../types/telegram';

export function useTelegramWebApp() {
  const [webApp, setWebApp] = useState<TelegramWebApp | undefined>(
    window.Telegram?.WebApp
  );

  useEffect(() => {
    // Only initialize if we're in a Telegram WebApp context
    if (webApp) {
      try {
        webApp.ready();
      } catch (error) {
        console.error('Failed to initialize Telegram WebApp:', error);
      }
    }
  }, [webApp]);

  return webApp;
}