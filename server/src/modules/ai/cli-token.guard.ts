import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class CliTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const authHeader = req.headers['authorization'];
    if (
      typeof authHeader !== 'string' ||
      !authHeader.toLowerCase().startsWith('bearer ')
    ) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice('bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const validation = await this.authService.validateCliToken(token);
    if (!validation) {
      throw new UnauthorizedException('Invalid CLI token');
    }

    const user = await this.authService.findUserById(validation.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    (req as any).user = user;
    return true;
  }
}
