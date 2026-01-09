import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { UserResponseDto } from '../auth/dto/user-response.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserPlan } from '../../common/enums/user-plan.enum';
import { AiUsageDaily } from '../ai/entities/ai-usage-daily.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(AiUsageDaily)
        private aiUsageRepository: Repository<AiUsageDaily>,
    ) {}

    async findAllUsers() {
        const users = await this.usersRepository.find({
            order: {
                createdAt: 'DESC',
            },
        });
        return { users: UserResponseDto.fromArray(users) };
    }

    async findOneUser(id: string) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return { user: new UserResponseDto(user) };
    }

    async updateUserRole(id: string, role: UserRole) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        user.role = role;
        await this.usersRepository.save(user);

        return {
            ok: true,
            message: `User role updated to ${role}`,
            user: new UserResponseDto(user)
        };
    }

    async updateUserPlan(id: string, plan: UserPlan, planExpiresAt?: string | null) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        user.plan = plan;

        if (planExpiresAt !== undefined) {
            user.planExpiresAt = planExpiresAt ? new Date(planExpiresAt) : null;
        }

        await this.usersRepository.save(user);

        return {
            ok: true,
            message: `User plan updated to ${plan}`,
            user: new UserResponseDto(user)
        };
    }

    async getSystemLogs(lines: number = 100) {
        const logPath = path.join(process.cwd(), 'logs', 'app.log');

        if (!fs.existsSync(logPath)) {
            return { logs: [], message: 'Log file not found' };
        }

        try {
            const content = await fs.promises.readFile(logPath, 'utf8');
            const allLines = content.split('\n').filter((line) => line.trim() !== '');
            const recentLines = allLines.slice(-lines);

            const parsedLogs = recentLines.map((line) => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    return { msg: line };
                }
            });

            return parsedLogs.reverse();
        } catch (error) {
            this.logger.error('Error reading log file', error as Error);
            return { logs: [], message: 'Error reading log file' };
        }
    }

    async getSystemMetrics() {
        const totalUsers = await this.usersRepository.count();

        const usersByPlan = await this.usersRepository
            .createQueryBuilder('user')
            .select('user.plan', 'plan')
            .addSelect('COUNT(*)', 'count')
            .groupBy('user.plan')
            .getRawMany();

        const usersByRole = await this.usersRepository
            .createQueryBuilder('user')
            .select('user.role', 'role')
            .addSelect('COUNT(*)', 'count')
            .groupBy('user.role')
            .getRawMany();

        const today = this.dayKeyUtc(new Date());
        const todayUsage = await this.aiUsageRepository
            .createQueryBuilder('usage')
            .select('SUM(usage.requestCount)', 'totalRequests')
            .where('usage.day = :day', { day: today })
            .getRawOne();

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentSignups = await this.usersRepository.count({
            where: {
                createdAt: MoreThanOrEqual(sevenDaysAgo)
            }
        });

        return {
            totalUsers,
            usersByPlan: usersByPlan.map(item => ({
                plan: item.plan,
                count: parseInt(item.count)
            })),
            usersByRole: usersByRole.map(item => ({
                role: item.role,
                count: parseInt(item.count)
            })),
            aiUsage: {
                today: today,
                totalRequests: todayUsage?.totalRequests ? parseInt(todayUsage.totalRequests) : 0
            },
            recentSignups: {
                last7Days: recentSignups
            }
        };
    }

    private dayKeyUtc(d: Date): string {
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
}
