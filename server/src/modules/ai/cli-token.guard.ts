import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class CliTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const authHeader = req.headers['authorization'];
    if (typeof authHeader !== 'string' || !authHeader.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice('bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    // Note: CanActivate supports async, but our signature here is sync.
    // We rely on Nest allowing Promise return; so cast to any to keep TS happy in this codebase.
    return (this.authService.validateCliToken(token).then((v) => {
      if (!v) {
        throw new UnauthorizedException('Invalid CLI token');
      }

      (req as any).user = { sub: v.userId, typ: 'cli' };
      return true;
    }) as any) as boolean;
  }
}
