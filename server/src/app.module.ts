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

 const isProduction = process.env.NODE_ENV === 'production';
 const shouldSynchronize =
   process.env.TYPEORM_SYNC != null
     ? process.env.TYPEORM_SYNC === 'true'
     : !isProduction;

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST!,
      port: Number(process.env.DB_PORT!),
      username: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
      entities: [User, CliDeviceCode, CliToken, AiUsageDaily],
      synchronize: shouldSynchronize,
    }),
    AuthModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
