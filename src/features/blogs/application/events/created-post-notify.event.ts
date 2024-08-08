import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { TelegramAdapter } from '../../../../infra/adapters/telegram.adapter';
import { IntegrationsRepository } from '../../../integrations/infrastructure/integrations.repository';

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
    const message = `New post published for blog ${blogTitle}`;
    const subscribers = await this.integrationsRepo.getUserTelegramIdsByBlogId(
      blogId,
    );
    console.log(subscribers);
    
    for (const sub of subscribers) {
      await this.tgAdapter.sendMessage(+sub.telegramId, message);
    }
  }
}
