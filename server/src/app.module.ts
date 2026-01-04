import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AiModule } from './modules/ai/ai.module';
import { CliDeviceCode } from './modules/auth/entities/cli-device-code.entity';
import { CliToken } from './modules/auth/entities/cli-token.entity';
import { User } from './modules/auth/entities/user.entity';
import { AiUsageDaily } from './modules/ai/entities/ai-usage-daily.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'orca',
      entities: [User, CliDeviceCode, CliToken, AiUsageDaily],
      synchronize: (process.env.TYPEORM_SYNC ?? 'true') === 'true',
    }),
    AuthModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
