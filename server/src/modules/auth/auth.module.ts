import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CliDeviceCode } from './entities/cli-device-code.entity';
import { CliToken } from './entities/cli-token.entity';
import { User } from './entities/user.entity';

import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CliTokenGuard } from '../ai/cli-token.guard';
import { UnifiedAuthGuard } from './unified-auth.guard';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    TypeOrmModule.forFeature([User, CliDeviceCode, CliToken]),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret',
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as StringValue,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy, JwtAuthGuard, CliTokenGuard, UnifiedAuthGuard],
  exports: [AuthService, JwtAuthGuard, CliTokenGuard, UnifiedAuthGuard],
})
export class AuthModule { }
