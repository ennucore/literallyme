// Security utility functions
export function isTelegramOrigin(origin: string): boolean {
  return origin.startsWith('https://t.me') || origin.startsWith('https://telegram.org');
}

export function validateTelegramWebApp(): boolean {
  try {
    if (!window.Telegram?.WebApp) {
      console.warn('Telegram WebApp is not available');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error validating Telegram WebApp:', error);
    return false;
  }
}