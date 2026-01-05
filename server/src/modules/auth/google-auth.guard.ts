import { Injectable, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  override getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const stateRaw = (req.query?.state as string | undefined) ?? undefined;

    const state = stateRaw ? String(stateRaw) : undefined;

    return {
      state,
    };
  }
}
