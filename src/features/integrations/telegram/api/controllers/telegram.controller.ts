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
import { TelegramCTX } from '../models/input/telegram-types';
import { SetWebhookTelegramBotCommand } from '../../application/use-cases/set-hook-telegram-bot.use-case';
import { HandleTelegramUpdatesCommand } from '../../application/use-cases/telegram-updates-handle.use-case';
import { GenerateAuthLinkTelegramBotCommand } from '../../application/use-cases/generate-auth-link-telegram-bot.use-case';
import { TelegramCrudApiService } from '../../application/tg-for-webhook-update.service';
import { RouterPaths } from '../../../../../infra/utils/routing';
import { AccessTokenGuard } from '../../../../auth/infrastructure/guards/accessToken.guard';
import { UserSessionDto } from '../../../../security/api/models/security-input.models/security-session-info.model';
import { CurrentUserInfo } from '../../../../auth/infrastructure/decorators/current-user-info.decorator';

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
