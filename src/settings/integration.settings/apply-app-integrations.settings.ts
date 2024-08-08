import { INestApplication } from '@nestjs/common';
import { TelegramAdapter } from '../../infra/adapters/telegram.adapter';
import { ConfigService } from '@nestjs/config';
import { connectToTelegram } from './telegram-connection';

export const applyAppIntegrationSettings = async (
  app: INestApplication,
  configService: ConfigService,
) => {
  const telegramAdapter = await app.resolve(TelegramAdapter);
  await connectToTelegram(configService, telegramAdapter);
};
