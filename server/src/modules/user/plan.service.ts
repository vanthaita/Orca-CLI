import { Injectable } from '@nestjs/common';
import { PLAN_CONFIGS } from '../../common/configs/plan-config';
import { FeaturePermission } from '../../common/enums/feature-permission.enum';
import { UserPlan } from '../../common/enums/user-plan.enum';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class PlanService {
    hasFeatureAccess(user: User, feature: FeaturePermission): boolean {
        if (!this.isPlanActive(user)) {
            return PLAN_CONFIGS[UserPlan.FREE].features.includes(feature);
        }

        const plan = user.plan || UserPlan.FREE;
        const config = PLAN_CONFIGS[plan];
        return config.features.includes(feature);
    }

    getDailyLimit(user: User): number | null {
        if (!this.isPlanActive(user)) {
            return PLAN_CONFIGS[UserPlan.FREE].dailyAiLimit;
        }

        if (user.dailyRequestLimit !== null && user.dailyRequestLimit !== undefined) {
            return user.dailyRequestLimit;
        }

        const plan = user.plan || UserPlan.FREE;
        return PLAN_CONFIGS[plan].dailyAiLimit;
    }

    isPlanActive(user: User): boolean {
        const plan = user.plan || UserPlan.FREE;

        if (plan === UserPlan.FREE) {
            return true;
        }

        if (!user.planExpiresAt) {
            return true;
        }

        return user.planExpiresAt.getTime() > Date.now();
    }

    getAvailableFeatures(user: User): FeaturePermission[] {
        if (!this.isPlanActive(user)) {
            return PLAN_CONFIGS[UserPlan.FREE].features;
        }

        const plan = user.plan || UserPlan.FREE;
        return PLAN_CONFIGS[plan].features;
    }

    getPlanConfig(user: User) {
        const plan = this.isPlanActive(user) ? (user.plan || UserPlan.FREE) : UserPlan.FREE;
        const config = PLAN_CONFIGS[plan];
        return {
            plan,
            name: config.name,
            dailyAiLimit: this.getDailyLimit(user),
            features: this.getAvailableFeatures(user),
            isActive: this.isPlanActive(user),
            expiresAt: user.planExpiresAt,
        };
    }
}
