export enum ProductPlan {
  Free = 'free',
  FirstBasicMonth = 'firstBasicMonth',
  FirstPremiumMonth = 'firstPremiumMonth',
  FirstPremiumMonthWithTrial = 'firstPremiumMonthWithTrial',
  Basic = 'basic',
  Monthly = 'monthly',
  Yearly = 'yearly',
  Premium = 'premium',
  Enterprise = 'enterprise',
}

const planMonthCounts = {
  basic: 1,
  monthly: 1,
  yearly: 12,
  premium: 1,
  enterprise: 1,
};

export const convertPlanMonthCount = (prodPlan: ProductPlan) => {
  return planMonthCounts[prodPlan] || 1;
};
