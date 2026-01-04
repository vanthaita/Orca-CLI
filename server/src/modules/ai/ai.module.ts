import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/entities/user.entity';
import { CliTokenGuard } from './cli-token.guard';
import { AiUsageDaily } from './entities/ai-usage-daily.entity';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User, AiUsageDaily])],
  controllers: [AiController],
  providers: [AiService, CliTokenGuard],
})
export class AiModule {}
