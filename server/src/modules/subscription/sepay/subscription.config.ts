import { UserPlan } from '../../../common/enums/user-plan.enum';

export interface PlanPrice {
  monthly: number;
  yearly: number;
}

export interface PlanPricing {
  [UserPlan.PRO]: PlanPrice;
  [UserPlan.TEAM]: PlanPrice;
}

export const PLAN_PRICING: PlanPricing = {
  [UserPlan.PRO]: {
    monthly: 170000,
    yearly: 1700000,
  },
  [UserPlan.TEAM]: {
    monthly: 480000,
    yearly: 4800000,
  },
};

export enum PaymentDuration {
  MONTHLY = '1M',
  YEARLY = '12M',
}

export function getPlanPrice(
  plan: UserPlan,
  duration: PaymentDuration,
): number | null {
  const pricing = PLAN_PRICING[plan];
  if (!pricing) return null;

  switch (duration) {
    case PaymentDuration.MONTHLY:
      return pricing.monthly;
    case PaymentDuration.YEARLY:
      return pricing.yearly;
    default:
      return null;
  }
}

export function getDurationInMonths(duration: PaymentDuration): number {
  switch (duration) {
    case PaymentDuration.MONTHLY:
      return 1;
    case PaymentDuration.YEARLY:
      return 12;
    default:
      return 0;
  }
}
