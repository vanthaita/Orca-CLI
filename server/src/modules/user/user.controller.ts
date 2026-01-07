import { Body, Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CliTokenGuard } from '../ai/cli-token.guard';
import { User } from '../auth/entities/user.entity';
import { PlanService } from './plan.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiUsageDaily } from '../ai/entities/ai-usage-daily.entity';

@Controller('user')
export class UserController {
    constructor(
        private readonly planService: PlanService,
        @InjectRepository(AiUsageDaily)
        private readonly usageRepo: Repository<AiUsageDaily>,
    ) { }

    @Get('plan')
    @UseGuards(CliTokenGuard)
    async getPlan(@Req() req: Request) {
        const user = (req as any).user as User | undefined;
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return this.planService.getPlanConfig(user);
    }

    @Get('features')
    @UseGuards(CliTokenGuard)
    async getFeatures(@Req() req: Request) {
        const user = (req as any).user as User | undefined;
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            features: this.planService.getAvailableFeatures(user),
        };
    }

    @Get('usage')
    @UseGuards(CliTokenGuard)
    async getUsage(@Req() req: Request) {
        const user = (req as any).user as User | undefined;
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

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
