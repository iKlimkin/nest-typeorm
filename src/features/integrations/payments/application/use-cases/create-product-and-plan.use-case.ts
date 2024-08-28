import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../../domain/transaction-wrapper';
import { StripeAdapter } from '../../../../../infra/adapters/stripe-adapter';
import { LayerNoticeInterceptor } from '../../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { BlogSubscriptionPlanModel } from '../../domain/entities/blog-subscription-plan-model.entity';
import { PaymentsRepository } from '../../infrastructure/payments.repository';
import { IBlogSubscriptionPlanModelDto } from '../../api/models/output/blog-subscription-plan.type';

export class CreateProductAndPlanCommand {
  constructor(public blogId: string) {}
}

@CommandHandler(CreateProductAndPlanCommand)
export class CreateProductAndPlanUseCase
  implements ICommandHandler<CreateProductAndPlanCommand>
{
  constructor(
    private readonly adapter: StripeAdapter,
    private paymentRepo: PaymentsRepository,
    private dataSource: DataSource,
  ) {}

  async execute(
    command: CreateProductAndPlanCommand,
  ): Promise<LayerNoticeInterceptor<IBlogSubscriptionPlanModelDto[]>> {
    return runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor<
        IBlogSubscriptionPlanModelDto[]
      >();
      const blogPlans = await this.adapter.createProductAndPlans();

      const plans = [];
      const doPush = Array.prototype.push.bind(plans);
      for (const plan of blogPlans) {
        const newPlanDto = BlogSubscriptionPlanModel.create({
          ...plan,
          ...command,
        });
        const { productData, ...productParams } = newPlanDto;
        doPush(productParams);
        await this.paymentRepo.saveEntity(newPlanDto, manager);
      }

      notice.addData(plans);
      return notice;
    });
  }
}
