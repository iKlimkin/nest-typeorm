import { RouterPaths } from '../helpers/routing';

export class IntegrationsRouting {
  constructor(private readonly baseUrl = RouterPaths.integrations.telegram) {}
  getAuthBotPersonalLink = () => `${this.baseUrl}/auth-bot-link`;
  setTelegramBotWebhook = () => `${this.baseUrl}/webhook`;
  forTelegramBotHook = () => `${this.baseUrl}`;
}
