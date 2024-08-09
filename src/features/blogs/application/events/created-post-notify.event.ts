import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { TelegramAdapter } from '../../../../infra/adapters/telegram.adapter';
import { IntegrationsRepository } from '../../../integrations/infrastructure/integrations.repository';
import { parse } from 'path';

export class NotifySubscribersEvent {
  constructor(
    public blogId: string,
    public blogTitle: string,
  ) {}
}

@EventsHandler(NotifySubscribersEvent)
export class NotifySubscribersEventHandler
  implements IEventHandler<NotifySubscribersEvent>
{
  constructor(
    private integrationsRepo: IntegrationsRepository,
    private tgAdapter: TelegramAdapter,
  ) {}
  async handle(event: NotifySubscribersEvent) {
    const { blogId, blogTitle } = event;

    const subscribers = await this.integrationsRepo.getUserTelegramIdsByBlogId(
      blogId,
    );

    for (const sub of subscribers) {
      const message = `Hey <b>${sub.telegramUsername}</b>! 🎉<br><br>Hurry up, a new post has just been published for the blog <b>${blogTitle}</b>.<br><br><a href="https://interact-hub.com/\`${blogId}\`">Check it out!</a>`;
      await this.tgAdapter.sendMessage(+sub.telegramId, message, {
        parse_mode: 'HTML',
      });
    }
  }
}
