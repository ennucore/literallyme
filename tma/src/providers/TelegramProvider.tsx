import React, { createContext, useContext, useEffect } from 'react';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { telegram } from '../services/telegram';
import { TelegramWebApp } from '../types/telegram';

interface TelegramContextValue {
  webApp?: TelegramWebApp;
  isAvailable: boolean;
}

const TelegramContext = createContext<TelegramContextValue>({
  isAvailable: false
});

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const webApp = useTelegramWebApp();

  useEffect(() => {
    if (webApp) {
      telegram.initialize(webApp);
    }
  }, [webApp]);

  return (
    <TelegramContext.Provider value={{ webApp, isAvailable: !!webApp }}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
}