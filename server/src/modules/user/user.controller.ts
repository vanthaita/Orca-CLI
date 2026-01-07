import { Body, Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CliTokenGuard } from '../ai/cli-token.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { PlanService } from './plan.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiUsageDaily } from '../ai/entities/ai-usage-daily.entity';

@Controller('user')
export class UserController {
    constructor(
        private readonly planService: PlanService,
        private readonly authService: AuthService,
        @InjectRepository(AiUsageDaily)
        private readonly usageRepo: Repository<AiUsageDaily>,
    ) { }

    private async getUserFromRequest(req: Request): Promise<User> {
        // Check if user is already attached (from CliTokenGuard)
        let user = (req as any).user as User | undefined;

        // If not, try to get from JWT payload
        if (!user || !user.id) {
            const userId = (req as any).user?.sub as string | undefined;
            if (!userId) {
                throw new UnauthorizedException('User not found');
            }
            const foundUser = await this.authService.findUserById(userId);
            if (!foundUser) {
                throw new UnauthorizedException('User not found');
            }
            user = foundUser;
        }

        return user;
    }

    @Get('plan')
    @UseGuards(JwtAuthGuard, CliTokenGuard)
    async getPlan(@Req() req: Request) {
        const user = await this.getUserFromRequest(req);
        return this.planService.getPlanConfig(user);
    }

    @Get('features')
    @UseGuards(JwtAuthGuard, CliTokenGuard)
    async getFeatures(@Req() req: Request) {
        const user = await this.getUserFromRequest(req);
        return {
            features: this.planService.getAvailableFeatures(user),
        };
    }

    @Get('usage')
    @UseGuards(JwtAuthGuard, CliTokenGuard)
    async getUsage(@Req() req: Request) {
        const user = await this.getUserFromRequest(req);

        const day = this.dayKeyUtc(new Date());
        const usage = await this.usageRepo.findOne({ where: { userId: user.id, day } });
        const dailyLimit = this.planService.getDailyLimit(user);

        return {
            day,
            requestCount: usage?.requestCount || 0,
            dailyLimit,
            remaining: dailyLimit === null ? null : Math.max(0, dailyLimit - (usage?.requestCount || 0)),
        };
    }

    private dayKeyUtc(d: Date): string {
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
}
