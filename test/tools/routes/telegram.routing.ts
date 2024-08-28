import { RouterPaths } from '../../../src/infra/utils/routing';

export class TelegramRouting {
  constructor(private readonly baseUrl = RouterPaths.integrations.telegram) {}
  getAuthBotPersonalLink = () => `${this.baseUrl}/auth-bot-link`;
  setTelegramBotWebhook = () => `${this.baseUrl}/webhook`;
  forTelegramBotHook = () => `${this.baseUrl}`;
}
