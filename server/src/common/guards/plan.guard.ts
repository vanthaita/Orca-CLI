import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { UserPlan } from '../enums/user-plan.enum';
import { PLAN_KEY } from '../decorators/require-plan.decorator';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlans = this.reflector.getAllAndOverride<UserPlan[]>(
      PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPlans || requiredPlans.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const user = (req as any).user;

    if (!user || !user.plan) {
      throw new ForbiddenException('User plan information not available');
    }

    const userPlan = user.plan as UserPlan;
    if (!requiredPlans.includes(userPlan)) {
      throw new ForbiddenException(
        `This feature requires ${requiredPlans.join(' or ')} plan. Your current plan: ${userPlan}. Please upgrade at https://orcacli.codes/pricing`,
      );
    }

    return true;
  }
}
