import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../../../domain/transaction-wrapper';
import { EmailUserSuccessMembershipPaymentEvent } from '../email-user-success-membership-payment.event';
import { EmailManager } from '../../../../../../infra/managers/email-manager';
import { UsersRepository } from '../../../../../admin/infrastructure/users.repo';
import { LayerNoticeInterceptor } from '../../../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';

@EventsHandler(EmailUserSuccessMembershipPaymentEvent)
export class EmailUserSuccessMembershipPaymentEventHandler
  implements IEventHandler<EmailUserSuccessMembershipPaymentEvent>
{
  constructor(
    private readonly emailManager: EmailManager,
    private readonly usersRepo: UsersRepository,
    private dataSource: DataSource,
  ) {}
  async handle(event: EmailUserSuccessMembershipPaymentEvent): Promise<void> {
    runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor();
      const user = await this.usersRepo.getUserById(event.userId);
      await this.emailManager.sendEmailMembershipSuccess(
        user.email,
        user.login,
      );
      return notice;
    });
  }
}
