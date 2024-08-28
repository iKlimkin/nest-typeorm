import { Currency } from '../enums/currency-type';
import { ProductPlan } from '../enums/product-plans';

export type UserPaymentsViewType = {
  userId: string;
  userLogin: string;
  blogId: string;
  blogTitle: string;
  membershipPlan: MembershipPlanType;
};

export type MembershipPlanType = {
  id: string;
  monthCount: number;
  price: number;
  currency: Currency;
};

export const getMembershipPayments = (plan: any): UserPaymentsViewType => ({
  userId: plan.userId,
  userLogin: plan.userLogin,
  blogId: plan.blogId,
  blogTitle: plan.blogTitle,
  membershipPlan: {
    id: plan.planId,
    monthCount: (plan.plan === ProductPlan.Yearly && 12) || 1,
    price: plan.price,
    currency: plan.currency,
  },
});
