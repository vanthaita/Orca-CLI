import { SetMetadata } from '@nestjs/common';
import { UserPlan } from '../enums/user-plan.enum';

export const PLAN_KEY = 'required_plans';
export const RequirePlan = (...plans: UserPlan[]) => SetMetadata(PLAN_KEY, plans);
