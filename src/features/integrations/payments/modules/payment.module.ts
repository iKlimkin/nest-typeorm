import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeAdapter } from '../../../../infra/adapters/stripe-adapter';
import { PaymentsManager } from '../../../../infra/managers/payments-manager';
import { CreateBlogMembershipPlansEventHandler } from '../../../blogs/application/events/create-blog-membership-plans.event-handler';
import { StripeController } from '../api/controllers/stripe.controller';
import { EmailUserSuccessMembershipPaymentEventHandler } from '../application/events/event-handlers/email-user-success-membership-payment.event-handler';
import { PaymentsCrudApiService } from '../application/payments-crud-api.service';
import { PaymentsScheduleService } from '../application/payments.schedule.service';
import { CompletePaymentUseCase } from '../application/use-cases/complete-payment-membership-plan.use-case';
import { ConfirmSubscriptionUseCase } from '../application/use-cases/confirm-subscription.use-case';
import { CreateProductAndPlanUseCase } from '../application/use-cases/create-product-and-plan.use-case';
import { HandlePaymentAfterSuccessUseCase } from '../application/use-cases/handle-payment-after-success.use-case';
import { HandlePaymentFailureUseCase } from '../application/use-cases/handle-payment-failure.use-case';
import { HandlePaymentUseCase } from '../application/use-cases/handle-payment-webhook.use-case';
import { BlogSubscriptionPlanModel } from '../domain/entities/blog-subscription-plan-model.entity';
import { MembershipBlogPlan } from '../domain/entities/membership-blog-plan.entity';
import { PaymentTransactionPlan } from '../domain/entities/payment-transaction-plan.entity';
import { PaymentsRepository } from '../infrastructure/payments.repository';
import { AuthModule } from '../../../auth/auth.module';
import { StripeSignatureGuard } from '../../../auth/infrastructure/guards/stripe-signature.guard';

@Module({
  imports: [
    AuthModule,
    CqrsModule,
    TypeOrmModule.forFeature([
      BlogSubscriptionPlanModel,
      PaymentTransactionPlan,
      MembershipBlogPlan,
    ]),
  ],
  controllers: [StripeController],
  providers: [
    HandlePaymentUseCase,
    CreateProductAndPlanUseCase,
    HandlePaymentFailureUseCase,
    ConfirmSubscriptionUseCase,
    HandlePaymentAfterSuccessUseCase,
    StripeAdapter,
    PaymentsRepository,
    PaymentsManager,
    CompletePaymentUseCase,
    PaymentsCrudApiService,
    StripeSignatureGuard,
    CreateBlogMembershipPlansEventHandler,
    EmailUserSuccessMembershipPaymentEventHandler,
    PaymentsScheduleService,
  ],
  exports: [PaymentsManager, PaymentsCrudApiService, PaymentsScheduleService],
})
export class PaymentModule {}
