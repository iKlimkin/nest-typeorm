import { BlogSubscriptionPlanModel } from '../../../domain/entities/blog-subscription-plan-model.entity';
import { ProductPlan } from '../enums/product-plans';
import { MembershipPlanType } from './user-payments.view-model';

export const getMembershipPlansViewModel = (
  planModels: BlogSubscriptionPlanModel[],
): MembershipPlanType[] =>
  planModels.map((plan) => ({
    id: plan.productId,
    monthCount: plan.productPlan !== ProductPlan.Yearly ? 1 : 12,
    price: plan.productPrice,
    currency: plan.productCurrency,
  }));
