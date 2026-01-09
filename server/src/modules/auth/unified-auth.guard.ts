import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CliTokenGuard } from '../ai/cli-token.guard';

@Injectable()
export class UnifiedAuthGuard implements CanActivate {
    constructor(
        private readonly jwtGuard: JwtAuthGuard,
        private readonly cliGuard: CliTokenGuard,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const jwtResult = await this.jwtGuard.canActivate(context);
            if (jwtResult) {
                return true;
            }
        } catch {
        }

        try {
            const cliResult = await this.cliGuard.canActivate(context);
            if (cliResult) {
                return true;
            }
        } catch {
        }

        throw new UnauthorizedException('Missing or invalid credentials');
    }
}
