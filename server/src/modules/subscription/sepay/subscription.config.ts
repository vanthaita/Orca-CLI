import { UserPlan } from '../../../common/enums/user-plan.enum';

export interface PlanPrice {
    monthly: number;
    yearly: number;
}

export interface PlanPricing {
    [UserPlan.PRO]: PlanPrice;
    [UserPlan.TEAM]: PlanPrice;
}

/**
 * Subscription pricing in VND (Vietnamese Dong)
 * Based on: Pro $7/month, Team $20/month
 * Exchange rate: ~24,000 VND/USD
 */
export const PLAN_PRICING: PlanPricing = {
    [UserPlan.PRO]: {
        monthly: 170000, // $7/month
        yearly: 1700000, // $70/year (~17% discount)
    },
    [UserPlan.TEAM]: {
        monthly: 480000, // $20/month
        yearly: 4800000, // $200/year (~17% discount)
    },
};

export enum PaymentDuration {
    MONTHLY = '1M',
    YEARLY = '12M',
}

export function getPlanPrice(plan: UserPlan, duration: PaymentDuration): number | null {
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
