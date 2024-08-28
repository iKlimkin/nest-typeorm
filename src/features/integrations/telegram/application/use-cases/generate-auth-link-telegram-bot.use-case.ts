import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { TelegramMetaUser } from '../../domain/entities/telegram-meta-user.entity';
import { TelegramRepository } from '../../infrastructure/telegram.repository';

export class GenerateAuthLinkTelegramBotCommand {
  constructor(public userId: string) {}
}

@CommandHandler(GenerateAuthLinkTelegramBotCommand)
export class GenerateAuthLinkTelegramBotUseCase
  implements ICommandHandler<GenerateAuthLinkTelegramBotCommand>
{
  constructor(private readonly integrationsRepo: TelegramRepository) {}

  async execute(
    command: GenerateAuthLinkTelegramBotCommand,
  ): Promise<{ link: string }> {
    const { userId } = command;

    const telegramMeta = await this.integrationsRepo.getTelegramMetaByUserId(
      userId,
    );

    let link = 'https://t.me/NoticeHubBot?start=';

    if (telegramMeta) {
      link += telegramMeta.telegramActivationCode;
      return { link };
    }

    const uniqueCode = uuidv4();
    link += uniqueCode;

    const telegramMetaDto = TelegramMetaUser.create(userId);
    telegramMetaDto.setTelegramActivationCode(uniqueCode);

    await this.integrationsRepo.save(telegramMetaDto);
    return { link };
  }
}
