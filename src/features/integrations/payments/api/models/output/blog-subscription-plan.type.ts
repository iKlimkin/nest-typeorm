import { ProductPlan } from '../enums/product-plans';
import { Currency } from '../enums/currency-type';

export interface IBlogSubscriptionPlanModelDto {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  subPlanType: ProductPlan;
  planData: Record<string, any>;
}

export interface ICreateBlogSubPlanModelDto
  extends IBlogSubscriptionPlanModelDto {
  blogId: string;
}
