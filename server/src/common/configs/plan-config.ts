import { FeaturePermission } from '../enums/feature-permission.enum';
import { UserPlan } from '../enums/user-plan.enum';

export interface PlanConfiguration {
    name: string;
    dailyAiLimit: number | null; // null means unlimited
    features: FeaturePermission[];
    priceUsd: number;
    maxUsers: number;
}

export const PLAN_CONFIGS: Record<UserPlan, PlanConfiguration> = {
    [UserPlan.FREE]: {
        name: 'Free Tier',
        dailyAiLimit: 7,
        features: [FeaturePermission.AI_COMMIT],
        priceUsd: 0,
        maxUsers: 1,
    },
    [UserPlan.PRO]: {
        name: 'Pro Tier',
        dailyAiLimit: null, // Unlimited
        features: [
            FeaturePermission.AI_COMMIT,
            FeaturePermission.AUTO_PUBLISH,
            FeaturePermission.AI_CONFLICT_RESOLUTION,
            FeaturePermission.AI_RELEASE_NOTES,
        ],
        priceUsd: 7,
        maxUsers: 1,
    },
    [UserPlan.TEAM]: {
        name: 'Team Tier',
        dailyAiLimit: null, // Unlimited
        features: [
            FeaturePermission.AI_COMMIT,
            FeaturePermission.AUTO_PUBLISH,
            FeaturePermission.AI_CONFLICT_RESOLUTION,
            FeaturePermission.AI_RELEASE_NOTES,
        ],
        priceUsd: 20,
        maxUsers: 5,
    },
};
