import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './modules/auth/entities/user.entity';

@Controller('health')
export class HealthController {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    @Get()
    async getHealth() {
        const dbHealthy = await this.checkDatabase();
        const uptime = process.uptime();

        return {
            status: dbHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(uptime),
            database: dbHealthy ? 'connected' : 'disconnected',
            version: process.env.npm_package_version || '1.0.0',
        };
    }

    @Get('ready')
    async getReadiness() {
        const dbHealthy = await this.checkDatabase();

        if (!dbHealthy) {
            return {
                status: 'not ready',
                timestamp: new Date().toISOString(),
            };
        }

        return {
            status: 'ready',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('live')
    async getLiveness() {
        return {
            status: 'alive',
            timestamp: new Date().toISOString(),
        };
    }

    private async checkDatabase(): Promise<boolean> {
        try {
            await this.userRepo.query('SELECT 1');
            return true;
        } catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }
}
