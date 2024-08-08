import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RouterPaths } from '../../../../../test/tools/helpers/routing';
import { TelegramCTX } from '../models/telegram-types';
import {
  AccessTokenGuard,
  CurrentUserInfo,
  UserSessionDto,
} from '../../../comments/api/controllers';
import { SetWebhookTelegramBotCommand } from '../../application/use-cases/set-hook-telegram-bot.use-case';
import { HandleTelegramUpdatesCommand } from '../../application/use-cases/telegram-updates-handle.use-case';
import { GenerateAuthLinkTelegramBotCommand } from '../../application/use-cases/generate-auth-link-telegram-bot.use-case';
import { TelegramCrudApiService } from '../../application/tg-for-webhook-update.service';

@Controller(RouterPaths.integrations.telegram)
export class TelegramController {
  constructor(
    private readonly commandBus: CommandBus,
    private telegramCrudApiService: TelegramCrudApiService,
  ) {}

  @UseGuards(AccessTokenGuard)
  @Get('auth-bot-link')
  async getAuthBotPersonalLink(
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<{ link: string }> {
    return this.commandBus.execute(
      new GenerateAuthLinkTelegramBotCommand(userInfo.userId),
    );
  }

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async forTelegramBotHook(@Body() ctx: TelegramCTX) {
    console.log({ payload: JSON.stringify(ctx) });
    const command = new HandleTelegramUpdatesCommand(ctx);
    return this.telegramCrudApiService.create(command);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setTelegramBotWebhook() {
    return this.commandBus.execute(new SetWebhookTelegramBotCommand());
  }
}
