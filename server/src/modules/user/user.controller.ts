import { Body, Controller, Get, Req, UnauthorizedException, UseGuards, Patch } from '@nestjs/common';
import type { Request } from 'express';
import { CliTokenGuard } from '../ai/cli-token.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UnifiedAuthGuard } from '../auth/unified-auth.guard';
import { User } from '../auth/entities/user.entity';
import { UserResponseDto } from '../auth/dto/user-response.dto';
import { AuthService } from '../auth/auth.service';
import { PlanService } from './plan.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
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
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    private async getUserFromRequest(req: Request): Promise<User> {
        // Check if user is already attached (from CliTokenGuard or JwtAuthGuard)
        let user = (req as any).user as User | undefined;

        // JwtAuthGuard and CliTokenGuard both return the full User entity
        // so we should already have the complete user object
        if (!user || !user.id) {
            throw new UnauthorizedException('User not found');
        }

        return user;
    }

    @Get('me')
    @UseGuards(UnifiedAuthGuard)
    async getMe(@Req() req: Request) {
        const user = await this.getUserFromRequest(req);
        return { user: new UserResponseDto(user) };
    }

    @Patch('profile')
    @UseGuards(UnifiedAuthGuard)
    async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
        const user = await this.getUserFromRequest(req);

        if (dto.name !== undefined) {
            user.name = dto.name;
            await this.userRepo.save(user);
        }

        return {
            ok: true,
            message: 'Profile updated successfully',
            user: new UserResponseDto(user)
        };
    }

    @Get('plan')
    @UseGuards(UnifiedAuthGuard)
    async getPlan(@Req() req: Request) {
        const user = await this.getUserFromRequest(req);
        return this.planService.getPlanConfig(user);
    }

    @Get('features')
    @UseGuards(UnifiedAuthGuard)
    async getFeatures(@Req() req: Request) {
        const user = await this.getUserFromRequest(req);
        return {
            features: this.planService.getAvailableFeatures(user),
        };
    }

    @Get('usage')
    @UseGuards(UnifiedAuthGuard)
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
