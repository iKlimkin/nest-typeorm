import { ConfigService } from '@nestjs/config';
import { TelegramAdapter } from '../../infra/adapters/telegram.adapter';
import { connectToNgrok } from './ngrok-connect';

export const connectToTelegram = async (
  configService: ConfigService,
  telegramAdapter: TelegramAdapter,
) => {
  try {
    const baseUrl = await connectToNgrok(configService.getOrThrow('port'));
    console.log({baseUrl});
    
    const webhookUrl = `${baseUrl}/integrations/telegram`;
    await telegramAdapter.setHookToTelegram(webhookUrl);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to connect through ngrok');
  }
};
