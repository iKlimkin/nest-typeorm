import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TelegramAdapter } from '../../../../../infra/adapters/telegram.adapter';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../../../../settings/config/configuration';
import { connectToNgrok } from '../../../../../settings/integration.settings/ngrok-connect';

export class SetWebhookTelegramBotCommand {}

@CommandHandler(SetWebhookTelegramBotCommand)
export class SetWebhookTelegramBotUseCase
  implements ICommandHandler<SetWebhookTelegramBotCommand>
{
  constructor(
    private readonly telegramAdapter: TelegramAdapter,
    private configService: ConfigService<ConfigurationType>,
  ) {}

  async execute(command: SetWebhookTelegramBotCommand): Promise<void> {
    const baseUrl = await this.getBaseUrl();
    const webhookUrl = `${baseUrl}/integrations/telegram`;
    await this.telegramAdapter.setHookToTelegram(webhookUrl);
  }

  private async getBaseUrl(): Promise<string> {
    try {
      const port = this.configService.getOrThrow('port');
      return await connectToNgrok(port);
    } catch (error) {
      console.error(error);
      throw new Error('Failed to connect through ngrok');
    }
  }
}
