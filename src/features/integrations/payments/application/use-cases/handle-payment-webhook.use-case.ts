import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../../domain/transaction-wrapper';
import { StripeAdapter } from '../../../../../infra/adapters/stripe-adapter';
import { GetErrors } from '../../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { PaymentsRepository } from '../../infrastructure/payments.repository';
import { CompletePaymentCommand } from './complete-payment-membership-plan.use-case';
import { HandlePaymentFailureCommand } from './handle-payment-failure.use-case';
import { PaymentStatus } from '../../domain/entities/payment-transaction-plan.entity';
import { StripeEvents } from '../../api/models/enums/stripe-events';
import {
  writeLogAsync,
  writeLogWithStream,
} from '../../../../../infra/utils/fs-utils';

export class HandlePaymentCommand {
  constructor(
    public signature: string,
    public rawBody: string,
  ) {}
}

@CommandHandler(HandlePaymentCommand)
export class HandlePaymentUseCase
  implements ICommandHandler<HandlePaymentCommand>
{
  private location = this.constructor.name;
  constructor(
    private readonly stripeAdapter: StripeAdapter,
    private readonly dataSource: DataSource,
    private readonly paymentsRepo: PaymentsRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(
    command: HandlePaymentCommand,
  ): Promise<LayerNoticeInterceptor<boolean>> {
    return runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor<boolean>();

      const event = this.stripeAdapter.createEvent(command);

      if (!event) {
        notice.addError(
          'event verification failed',
          this.location,
          GetErrors.IncorrectModel,
        );
        return notice;
      }

      if (event.type === StripeEvents.INVOICE_PAYMENT_SUCCEEDED) {
        const customerName = event.data.object.customer_name;
        const invoiceId = event.data.object.id;
        const hostedInvoiceUrl = event.data.object.hosted_invoice_url;
        const startDate = event.data.object.period_start;
        const endDate = event.data.object.period_end;
        // const paymentTransaction =
        // await this.paymentsRepo.;
      }
      if (event.type === StripeEvents.CHECKOUT_SESSION_COMPLETED) {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const sessionId = session.id;

        const paymentTransaction =
          await this.paymentsRepo.getPaymentBySessionId(sessionId);

        if (!paymentTransaction) {
          notice.addError(
            'payment transaction not found',
            this.location,
            GetErrors.Transaction,
          );
          return notice;
        }
        // session.hosted_invoice_url = paymentTransaction.invoiceUrl;
        paymentTransaction.addPaymentCheckoutInfo(session);

        switch (session.payment_status) {
          case 'paid':
            this.commandBus.execute(
              new CompletePaymentCommand(userId, paymentTransaction),
            );
            break;
          case 'unpaid':
            this.commandBus.execute(
              new HandlePaymentFailureCommand(paymentTransaction),
            );
            break;
          case 'no_payment_required':
            paymentTransaction.paymentStatus =
              PaymentStatus.NO_PAYMENT_REQUIRED;
            this.paymentsRepo.saveEntity(paymentTransaction, manager);
            break;
          default:
            this.paymentsRepo.saveEntity(paymentTransaction, manager);
            break;
        }
      }

      notice.addData(true);
      return notice;
    });
  }
}
