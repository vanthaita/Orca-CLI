import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanService } from './plan.service';
import { UserController } from './user.controller';
import { User } from '../auth/entities/user.entity';
import { AiUsageDaily } from '../ai/entities/ai-usage-daily.entity';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([User, AiUsageDaily]), AuthModule],
    controllers: [UserController],
    providers: [PlanService],
    exports: [PlanService],
})
export class UserModule { }
