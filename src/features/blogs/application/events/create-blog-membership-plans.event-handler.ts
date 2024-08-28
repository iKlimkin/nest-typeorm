import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { StripeAdapter } from '../../../../infra/adapters/stripe-adapter';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { BlogSubscriptionPlanModel } from '../../../integrations/payments/domain/entities/blog-subscription-plan-model.entity';
import { PaymentsRepository } from '../../../integrations/payments/infrastructure/payments.repository';

export class CreateBlogMembershipPlansEvent {
  constructor(public blogId: string) {}
}

@EventsHandler(CreateBlogMembershipPlansEvent)
export class CreateBlogMembershipPlansEventHandler
  implements IEventHandler<CreateBlogMembershipPlansEvent>
{
  constructor(
    private readonly adapter: StripeAdapter,
    private paymentRepo: PaymentsRepository,
    private dataSource: DataSource,
  ) {}
  async handle(event: CreateBlogMembershipPlansEvent): Promise<void> {
    runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor();
      const blogPlans = await this.adapter.createProductAndPlans();

      const plans = blogPlans.map((plan) => {
        const newPlanDto = BlogSubscriptionPlanModel.create({
          ...plan,
          ...event,
        });
        return this.paymentRepo.saveEntity(newPlanDto, manager);
      });

      await Promise.all(plans);

      return notice;
    });
  }
}
