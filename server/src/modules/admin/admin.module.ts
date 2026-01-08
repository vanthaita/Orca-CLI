import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { AiUsageDaily } from '../ai/entities/ai-usage-daily.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
    imports: [TypeOrmModule.forFeature([User, AiUsageDaily])],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }
