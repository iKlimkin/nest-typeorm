import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ConfirmSubscriptionCommand } from './confirm-subscription.use-case';
import { HandlePaymentFailureCommand } from './handle-payment-failure.use-case';
import { runInTransaction } from '../../../../../domain/transaction-wrapper';
import { StripeAdapter } from '../../../../../infra/adapters/stripe-adapter';
import { LayerNoticeInterceptor } from '../../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';

export class HandlePaymentAfterSuccessCommand {
  constructor(public sessionId: string) {}
}

@CommandHandler(HandlePaymentAfterSuccessCommand)
export class HandlePaymentAfterSuccessUseCase
  implements ICommandHandler<HandlePaymentAfterSuccessCommand>
{
  constructor(
    private readonly adapter: StripeAdapter,
    private dataSource: DataSource,
    private commandBus: CommandBus,
  ) {}

  async execute(
    command: HandlePaymentAfterSuccessCommand,
  ): Promise<LayerNoticeInterceptor<{ name: string }>> {
    const { sessionId } = command;
    return runInTransaction(this.dataSource, async (manager) => {
      const { customer } = await this.adapter.retrieveSessionWithCustomer(
        sessionId,
      );

      // const paymentStatus = session.payment_status;
      // const userId = session.client_reference_id;

      // if (paymentStatus === 'paid') {
      //   await this.commandBus.execute(
      //     new ConfirmSubscriptionCommand(userId, sessionId),
      //   );
      // } else {
      //   await this.commandBus.execute(
      //     new HandlePaymentFailureCommand(userId, sessionId),
      //   );
      // }

      return new LayerNoticeInterceptor({
        name: customer.name,
      });
    });
  }
}
