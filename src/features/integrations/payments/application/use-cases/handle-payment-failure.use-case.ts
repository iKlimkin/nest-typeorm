import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../../domain/transaction-wrapper';
import { StripeAdapter } from '../../../../../infra/adapters/stripe-adapter';
import { LayerNoticeInterceptor } from '../../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import Stripe from 'stripe';
import {
  PaymentStatus,
  PaymentTransactionPlan,
} from '../../domain/entities/payment-transaction-plan.entity';
import { PaymentsRepository } from '../../infrastructure/payments.repository';

export class HandlePaymentFailureCommand {
  constructor(public paymentTransaction: PaymentTransactionPlan) {}
}

@CommandHandler(HandlePaymentFailureCommand)
export class HandlePaymentFailureUseCase
  implements ICommandHandler<HandlePaymentFailureCommand>
{
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private dataSource: DataSource,
  ) {}

  async execute(command: HandlePaymentFailureCommand): Promise<void> {
    const { paymentTransaction } = command;
    runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor();

      paymentTransaction.changePaymentStatus(PaymentStatus.UNPAID);
      this.paymentsRepository.saveEntity(paymentTransaction, manager);

      return notice;
    });
  }
}
