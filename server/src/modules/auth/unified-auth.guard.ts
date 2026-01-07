import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CliTokenGuard } from '../ai/cli-token.guard';

@Injectable()
export class UnifiedAuthGuard implements CanActivate {
    constructor(
        private readonly jwtGuard: JwtAuthGuard,
        private readonly cliGuard: CliTokenGuard,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 1. Try JWT (Cookie)
        try {
            // We need to clone the context or just reuse depending on if guards modify it destructively.
            // Passport strategies usually attach user to req.user.
            // If JWT succeeds, req.user is set.
            const jwtResult = await this.jwtGuard.canActivate(context);
            if (jwtResult) {
                return true;
            }
        } catch (error) {
            // JWT failed (e.g. no cookie or invalid token)
            // Ignore and try next strategy
        }

        // 2. Try CLI Token (Bearer)
        try {
            const cliResult = await this.cliGuard.canActivate(context);
            if (cliResult) {
                return true;
            }
        } catch (error) {
            // CLI token failed
        }

        throw new UnauthorizedException('Missing or invalid credentials');
    }
}
