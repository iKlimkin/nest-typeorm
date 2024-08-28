import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { StripeCreatedPaymentResponse } from '../../../../infra/adapters/stripe-adapter';
import { PaymentsManager } from '../../../../infra/managers/payments-manager';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { PaymentSystemEnum } from '../../../integrations/payments/api/models/enums/currency-type';
import { OutputSessionUrlType } from '../../../integrations/payments/api/models/output/stripe-payments.output.types';
import { PaymentTransactionPlan } from '../../../integrations/payments/domain/entities/payment-transaction-plan.entity';
import { LayerNoticeInterceptor } from '../../../posts/api/controllers';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { JoinTheMembershipPlanCommand } from './commands/join-the-membership-plan.command';
import { PaymentsScheduleService } from '../../../integrations/payments/application/payments.schedule.service';
import { BlogService } from '../blog.service';
import { UsersRepository } from '../../../admin/infrastructure/users.repo';

@CommandHandler(JoinTheMembershipPlanCommand)
export class JoinTheMembershipPlanUseCase
  implements ICommandHandler<JoinTheMembershipPlanCommand>
{
  private readonly location = this.constructor.name;
  constructor(
    private dataSource: DataSource,
    private blogRepo: BlogsRepository,
    private readonly paymentsManager: PaymentsManager<StripeCreatedPaymentResponse>,
    private paymentService: PaymentsScheduleService,
    private blogService: BlogService,
    private userRepo: UsersRepository,
  ) {}

  async execute(
    command: JoinTheMembershipPlanCommand,
  ): Promise<LayerNoticeInterceptor<OutputSessionUrlType>> {
    const { blogId, membershipPlanId, userId } = command;
    return runInTransaction(this.dataSource, async (manager) => {
      let notice = new LayerNoticeInterceptor<OutputSessionUrlType>();

      const blog = await this.blogRepo.getBlogById(blogId);
      const user = await this.userRepo.getUserById(userId);

      if (blog.user.id === user.id) {
        notice.addError(
          `User with id ${userId} is blog owner`,
          this.location,
          GetErrors.Forbidden,
        );
        return notice;
      }

      const blogWithPlanModels = await this.blogRepo.getMembershipPlanModels(
        membershipPlanId,
      );

      if (
        !blogWithPlanModels ||
        !blogWithPlanModels.subscriptionPlanModels.length
      ) {
        notice.addError(
          'membership plan was not found',
          this.location,
          GetErrors.NotFound,
        );
        return notice;
      }

      const { productPrice, productCurrency, productId } =
        blogWithPlanModels.subscriptionPlanModels[0];

      const paymentInfo = await this.paymentsManager.createPayment({
        planId: membershipPlanId,
        userId,
        paymentSystem: PaymentSystemEnum.Stripe,
      });

      const paymentTransactionPlanInfo = PaymentTransactionPlan.create({
        productId,
        paymentSystem: PaymentSystemEnum.Stripe,
        paymentProviderInfo: paymentInfo,
        price: productPrice,
        userId,
        currency: productCurrency,
      });

      const savedPayment = await this.blogRepo.saveEntity(
        paymentTransactionPlanInfo,
        manager,
      );

      this.paymentService.addJob(savedPayment.id);

      notice.addData({ url: paymentInfo.url });
      return notice;
    });
  }
}
