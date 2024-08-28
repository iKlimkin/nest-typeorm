import { Repository, DataSource } from 'typeorm';
import {
  Currency,
  PaymentSystemEnum,
} from '../../../src/features/integrations/payments/api/models/enums/currency-type';
import { ProductPlan } from '../../../src/features/integrations/payments/api/models/enums/product-plans';
import { BlogSubscriptionPlanModel } from '../../../src/features/integrations/payments/domain/entities/blog-subscription-plan-model.entity';
import { MembershipBlogPlan } from '../../../src/features/integrations/payments/domain/entities/membership-blog-plan.entity';
import {
  PaymentTransactionPlan,
  PaymentStatus,
} from '../../../src/features/integrations/payments/domain/entities/payment-transaction-plan.entity';

export class MembershipPlansSeeder {
  private blogPlanModelsRepo: Repository<BlogSubscriptionPlanModel>;
  private membershipPlansRepo: Repository<MembershipBlogPlan>;
  private paymentTransactionPlansRepo: Repository<PaymentTransactionPlan>;
  constructor(private dataSource: DataSource) {
    this.blogPlanModelsRepo = this.dataSource.getRepository(
      BlogSubscriptionPlanModel,
    );
    this.membershipPlansRepo =
      this.dataSource.getRepository(MembershipBlogPlan);
    this.paymentTransactionPlansRepo = this.dataSource.getRepository(
      PaymentTransactionPlan,
    );
  }

  run = async (userId: string, blogId: string) => {
    const {
      blogPlanModelsRepo,
      membershipPlansRepo,
      paymentTransactionPlansRepo,
    } = this;

    const planModel = blogPlanModelsRepo.create({
      productId: 'prod_001',
      blog: { id: blogId },
      productTitle: 'Test Subscription Plan',
      productPlan: ProductPlan.Monthly,
      productPriceInCents: 999,
      productPrice: 9.99,
      productData: { features: ['Feature 1', 'Feature 2'] },
      productCurrency: Currency.USD,
    });
    await blogPlanModelsRepo.save(planModel);

    const membershipPlan = membershipPlansRepo.create({
      blog: { id: blogId },
      user: { id: userId },
      blogPlanModel: planModel,
      subscribedAt: new Date(),
      isActive: true,
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    });
    await membershipPlansRepo.save(membershipPlan);

    const paymentTransaction = paymentTransactionPlansRepo.create({
      paymentSystem: PaymentSystemEnum.Stripe,
      membershipPlan: membershipPlan,
      user: { id: userId },
      productId: planModel.productId,
      price: planModel.productPriceInCents,
      paymentStatus: PaymentStatus.SUCCESS,
      sessionId: 'session_001',
      currency: Currency.USD,
      paymentProviderInfo: { id: 'session_001', provider: 'Stripe' },
    });
    await paymentTransactionPlansRepo.save(paymentTransaction);
  };
}
