import { EmailNotificationEvent } from '../email-notification-event';
import { EmailManager } from '../../../../../../infra/managers/email-manager';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

@EventsHandler(EmailNotificationEvent)
export class UserCreatedNoticeEventHandler
  implements IEventHandler<EmailNotificationEvent>
{
  constructor(private emailManager: EmailManager) {}
  handle(event: EmailNotificationEvent) {
    this.emailManager.sendEmailConfirmationMessage(
      event.email,
      event.confirmationCode,
    );
  }
}
