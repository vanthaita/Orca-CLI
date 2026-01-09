import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { validate } from './common/configs/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { AiModule } from './modules/ai/ai.module';
import { CliDeviceCode } from './modules/auth/entities/cli-device-code.entity';
import { CliToken } from './modules/auth/entities/cli-token.entity';
import { User } from './modules/auth/entities/user.entity';
import { AiUsageDaily } from './modules/ai/entities/ai-usage-daily.entity';
import { SepayTransaction } from './modules/subscription/sepay/entities/sepay-transaction.entity';
import { ReleaseModule } from './modules/release/release.module';
import { UserModule } from './modules/user/user.module';
import { AdminModule } from './modules/admin/admin.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';

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
            transport: {
              targets: [
                ...(isProduction
                  ? []
                  : [
                    {
                      target: 'pino-pretty',
                      options: {
                        singleLine: true,
                      },
                    },
                  ]),
                {
                  target: 'pino/file',
                  options: {
                    destination: 'logs/app.log',
                    mkdir: true,
                  },
                },
              ],
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
        entities: [User, CliDeviceCode, CliToken, AiUsageDaily, SepayTransaction],
        synchronize:
          configService.get<string>('TYPEORM_SYNC') === 'true' ||
          configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    TypeOrmModule.forFeature([User]),
    AuthModule,
    AiModule,
    ReleaseModule,
    UserModule,
    AdminModule,
    SubscriptionModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
