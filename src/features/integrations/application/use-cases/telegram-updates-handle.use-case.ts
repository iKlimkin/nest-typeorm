import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TelegramAdapter } from '../../../../infra/adapters/telegram.adapter';
import { LinkUserToTelegramBotCommand } from './link-user-to-telegram-bot.use-case';
import { LayerNoticeInterceptor } from '../../../posts/api/controllers';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';

export class HandleTelegramUpdatesCommand {
  constructor(public payload: any) {}
}

@CommandHandler(HandleTelegramUpdatesCommand)
export class HandleTelegramUpdatesUseCase
  implements ICommandHandler<HandleTelegramUpdatesCommand>
{
  constructor(
    private readonly telegramAdapter: TelegramAdapter,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(
    command: HandleTelegramUpdatesCommand,
  ): Promise<LayerNoticeInterceptor> {
    const notice = new LayerNoticeInterceptor();
    const { payload } = command;

    if (payload.message) {
      const { from, text } = payload.message;
      const [commandText, code] = text.trim().split(' ');

      if (commandText === '/start' && code) {
        const command = new LinkUserToTelegramBotCommand(
          code,
          from.id,
          from.username,
        );
        return await this.commandBus.execute(command);
      }

      if (commandText === '/help') {
        await this.telegramAdapter.sendMessage(from.id, 'Help message here...');
        return;
      }
      if (commandText === '/contact_us') {
        await this.telegramAdapter.sendMessage(from.id, 'Contact us here...');
        return;
      }

      await this.telegramAdapter.sendMessage(
        from.id,
        'Invalid command. Please try again',
      );

      return notice;
    }
    return notice;
  }
}
