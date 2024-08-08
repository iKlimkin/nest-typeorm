import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../posts/api/controllers';
import { IntegrationsRepository } from '../../infrastructure/integrations.repository';

export class LinkUserToTelegramBotCommand {
  constructor(
    public code: string,
    public telegramId: string,
    public telegramUsername: string,
  ) {}
}

@CommandHandler(LinkUserToTelegramBotCommand)
export class LinkUserToTelegramBotUseCase
  implements ICommandHandler<LinkUserToTelegramBotCommand>
{
  private location = this.constructor.name;
  constructor(private readonly integrationsRepo: IntegrationsRepository) {}

  async execute(
    command: LinkUserToTelegramBotCommand,
  ): Promise<LayerNoticeInterceptor> {
    const { telegramId, telegramUsername, code } = command;
    const notice = new LayerNoticeInterceptor();
    const userId =
      await this.integrationsRepo.getUserIdByTelegramActivationCode(code);
    if (userId) {
      const telegramMeta = await this.integrationsRepo.getTelegramMetaByUserId(
        userId,
      );
      if (telegramMeta) {
        telegramMeta.setTelegramId(telegramId);
        telegramUsername && telegramMeta.setTelegramUsername(telegramUsername);
        await this.integrationsRepo.save(telegramMeta);
      }
      return notice;
    }

    notice.addError(
      'Telegram account or user not found',
      this.location,
      GetErrors.NotFound,
    );
    return notice;
  }
}
