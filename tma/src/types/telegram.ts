export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramWebAppInitData {
  user?: TelegramUser;
}

export interface TelegramWebApp {
  ready: () => void;
  openInvoice: (url: string) => void;
  initDataUnsafe: TelegramWebAppInitData;
}