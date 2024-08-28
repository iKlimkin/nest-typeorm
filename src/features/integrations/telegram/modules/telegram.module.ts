import { Module } from '@nestjs/common';
import { GenerateAuthLinkTelegramBotUseCase } from '../application/use-cases/generate-auth-link-telegram-bot.use-case';
import { TelegramController } from '../api/controllers/telegram.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { LinkUserToTelegramBotUseCase } from '../application/use-cases/link-user-to-telegram-bot.use-case';
import { SetWebhookTelegramBotUseCase } from '../application/use-cases/set-hook-telegram-bot.use-case';
import { HandleTelegramUpdatesUseCase } from '../application/use-cases/telegram-updates-handle.use-case';
import { TelegramRepository } from '../infrastructure/telegram.repository';
import { TelegramCrudApiService } from '../application/tg-for-webhook-update.service';
import { TelegramAdapter } from '../../../../infra/adapters/telegram.adapter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramMetaUser } from '../domain/entities/telegram-meta-user.entity';
import { NotifySubscribersEventHandler } from '../application/events/created-post-notify.event';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([TelegramMetaUser]),
    CqrsModule,
  ],
  controllers: [TelegramController],
  providers: [
    GenerateAuthLinkTelegramBotUseCase,
    LinkUserToTelegramBotUseCase,
    SetWebhookTelegramBotUseCase,
    HandleTelegramUpdatesUseCase,
    TelegramCrudApiService,
    TelegramRepository,
    TelegramAdapter,
    NotifySubscribersEventHandler,
  ],
})
export class TelegramModule {}
