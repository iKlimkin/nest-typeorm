import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../../domain/transaction-wrapper';
import { LayerNoticeInterceptor } from '../../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { MembershipBlogPlan } from '../../domain/entities/membership-blog-plan.entity';
import {
  PaymentStatus,
  PaymentTransactionPlan,
} from '../../domain/entities/payment-transaction-plan.entity';
import { PaymentsRepository } from '../../infrastructure/payments.repository';
import { EmailUserSuccessMembershipPaymentEvent } from '../events/email-user-success-membership-payment.event';

export class CompletePaymentCommand {
  constructor(
    public userId: string,
    public paymentTransaction: PaymentTransactionPlan,
  ) {}
}

@CommandHandler(CompletePaymentCommand)
export class CompletePaymentUseCase
  implements ICommandHandler<CompletePaymentCommand>
{
  private location = this.constructor.name;
  constructor(
    private readonly dataSource: DataSource,
    private readonly paymentsRepo: PaymentsRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CompletePaymentCommand): Promise<void> {
    const { userId, paymentTransaction } = command;
    runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor();

      const blogPlanModel = await this.paymentsRepo.getBlogPlanModel(
        paymentTransaction.productId,
      );

      const membershipPlanDto = MembershipBlogPlan.create({
        blogId: blogPlanModel.blogId,
        userId,
        planId: blogPlanModel.id,
        planType: blogPlanModel.productPlan,
      });
      const membershipPlan = await this.paymentsRepo.saveEntity(
        membershipPlanDto,
        manager,
      );
      paymentTransaction.completePaymentTransaction({
        membershipPlanId: membershipPlan.id,
        paymentStatus: PaymentStatus.SUCCESS,
      });

      await this.paymentsRepo.saveEntity(paymentTransaction, manager);

      this.eventBus.publish(new EmailUserSuccessMembershipPaymentEvent(userId));

      return notice;
    });
  }
}
