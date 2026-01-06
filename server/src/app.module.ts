import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { validate } from './common/configs/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AiModule } from './modules/ai/ai.module';
import { CliDeviceCode } from './modules/auth/entities/cli-device-code.entity';
import { CliToken } from './modules/auth/entities/cli-token.entity';
import { User } from './modules/auth/entities/user.entity';
import { AiUsageDaily } from './modules/ai/entities/ai-usage-daily.entity';



import { ReleaseModule } from './modules/release/release.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            customProps: (req, res) => ({
              context: 'HTTP',
            }),
            transport: isProduction
              ? undefined
              : {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                },
              },
          },
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [User, CliDeviceCode, CliToken, AiUsageDaily],
        synchronize:
          configService.get<string>('TYPEORM_SYNC') === 'true' ||
          configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    AuthModule,
    AiModule,
    ReleaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
