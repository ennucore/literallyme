import { useTelegram } from '../providers/TelegramProvider';
import { TelegramUser } from '../types/telegram';

export function useTelegramUser(): TelegramUser | undefined {
  const { webApp } = useTelegram();
  return webApp?.initDataUnsafe?.user;
}