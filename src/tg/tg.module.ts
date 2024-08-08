import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TgController } from './tg.controller';
import { TgService } from './application/tg.service';
import { TelegramAdapter } from '../infra/adapters/telegram.adapter';

@Module({
  imports: [CqrsModule],
  providers: [TgService, TelegramAdapter],
  controllers: [TgController],
  exports: [TelegramAdapter],
})
export class TgModule {}
