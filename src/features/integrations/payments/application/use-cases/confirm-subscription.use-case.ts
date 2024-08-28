import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../../domain/transaction-wrapper';
import { LayerNoticeInterceptor } from '../../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';

export class ConfirmSubscriptionCommand {
  constructor(
    public sessionId: string,
    public userId: String,
  ) {}
}

@CommandHandler(ConfirmSubscriptionCommand)
export class ConfirmSubscriptionUseCase
  implements ICommandHandler<ConfirmSubscriptionCommand>
{
  constructor(
    private dataSource: DataSource,
    private commandBus: CommandBus,
  ) {}

  async execute(command: ConfirmSubscriptionCommand): Promise<void> {
    const { sessionId } = command;
    runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor();

      /**
       * PaymentTransactionPlan.paymentStatus = PaymentStatus.SUCCESS
       */

      return notice;
    });
  }
}
