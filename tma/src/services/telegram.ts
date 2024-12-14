import { TelegramWebApp } from '../types/telegram';
import { TELEGRAM_CONFIG } from '../config/telegram';

class TelegramService {
  private webApp?: TelegramWebApp;

  initialize(webApp: TelegramWebApp) {
    this.webApp = webApp;
  }

  public get isAvailable(): boolean {
    return !!this.webApp;
  }

  public get userName(): string | undefined {
    return this.webApp?.initDataUnsafe?.user?.first_name;
  }

  public openInvoice(invoiceId: string): void {
    if (!this.isAvailable) {
      console.warn('Telegram WebApp is not available');
      return;
    }
    const url = `${TELEGRAM_CONFIG.INVOICE_BASE_URL}/${invoiceId}`;
    this.webApp?.openInvoice(url);
  }
}

export const telegram = new TelegramService();