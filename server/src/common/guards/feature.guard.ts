import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { FeaturePermission } from '../enums/feature-permission.enum';
import { FEATURE_KEY } from '../decorators/require-feature.decorator';
import { User } from '../../modules/auth/entities/user.entity';
import { PlanService } from '../../modules/user/plan.service';

@Injectable()
export class FeatureGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private planService: PlanService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredFeatures = this.reflector.getAllAndOverride<FeaturePermission[]>(FEATURE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredFeatures || requiredFeatures.length === 0) {
            return true;
        }

        const req = context.switchToHttp().getRequest<Request>();
        const user = (req as any).user as User | undefined;

        if (!user) {
            throw new ForbiddenException('User information not available');
        }

        for (const feature of requiredFeatures) {
            if (!this.planService.hasFeatureAccess(user, feature)) {
                throw new ForbiddenException(
                    `This feature (${feature}) requires a Pro or Team plan. Please upgrade at https://orcacli.codes/pricing`,
                );
            }
        }

        return true;
    }
}
