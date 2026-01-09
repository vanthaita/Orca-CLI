import { Body, Controller, Get, Param, Post, Req, Res, UnauthorizedException, UseGuards, Logger } from '@nestjs/common';
import type { Request } from 'express';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { GoogleUserPayload } from './google.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CliTokenGuard } from '../ai/cli-token.guard';
import { UserResponseDto } from './dto/user-response.dto';

type RequestWithUser = Request & { user: GoogleUserPayload };
type RequestWithCookies = Request & { cookies?: Record<string, string | undefined> };

type RefreshBody = { refreshToken?: string };
type CliStartResponse = {
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
  expiresIn: number;
  interval: number;
};

type CliPollBody = { deviceCode?: string; deviceName?: string; deviceFingerprint?: string };
type CliPollResponse =
  | { status: 'authorization_pending'; interval: number }
  | { status: 'slow_down'; interval: number }
  | { status: 'expired' }
  | { status: 'ok'; accessToken: string; expiresIn: number };

type CliVerifyBody = { userCode?: string };
type RenameTokenBody = { name?: string };

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Get('cli/start')
  async cliStart(@Req() req: Request): Promise<CliStartResponse> {
    const ipAddress = this.extractIpAddress(req);
    return this.authService.startCliLogin(ipAddress);
  }

  @Post('cli/poll')
  async cliPoll(@Req() req: Request, @Body() body: CliPollBody): Promise<CliPollResponse> {
    const deviceCode = body.deviceCode?.trim();
    if (!deviceCode) {
      throw new UnauthorizedException('Missing deviceCode');
    }
    const deviceName = body.deviceName?.trim();
    const deviceFingerprint = body.deviceFingerprint?.trim();
    const ipAddress = this.extractIpAddress(req);
    const userAgent = req.headers['user-agent'];
    return this.authService.pollCliLogin(deviceCode, deviceName, deviceFingerprint, ipAddress, userAgent);
  }

  @Get('cli/me')
  @UseGuards(CliTokenGuard)
  async cliMe(@Req() req: Request) {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      throw new UnauthorizedException('Missing user');
    }

    const user = await this.authService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { data: { email: user.email, name: user.name } };
  }

  @Post('cli/verify')
  @UseGuards(JwtAuthGuard)
  async cliVerify(@Req() req: Request, @Body() body: CliVerifyBody) {
    const userCode = body.userCode?.trim();
    if (!userCode) {
      throw new UnauthorizedException('Missing userCode');
    }

    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      throw new UnauthorizedException('Missing user');
    }

    return this.authService.approveCliLogin(userId, userCode);
  }

  @Get('cli/tokens')
  @UseGuards(JwtAuthGuard)
  async cliTokens(@Req() req: Request) {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      throw new UnauthorizedException('Missing user');
    }
    const tokens = await this.authService.listCliTokens(userId);

    return {
      tokens: tokens.map((t) => ({
        id: t.id,
        label: t.label,
        deviceName: t.deviceName,
        deviceFingerprint: t.deviceFingerprint,
        ipAddress: t.ipAddress,
        lastUsedAt: t.lastUsedAt,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt,
        revokedAt: t.revokedAt,
      })),
    };
  }

  @Post('cli/tokens/:id/revoke')
  @UseGuards(JwtAuthGuard)
  async cliRevoke(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      throw new UnauthorizedException('Missing user');
    }
    return this.authService.revokeCliToken(userId, id);
  }

  @Post('cli/tokens/:id/rename')
  @UseGuards(JwtAuthGuard)
  async cliRename(@Req() req: Request, @Param('id') id: string, @Body() body: RenameTokenBody) {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      throw new UnauthorizedException('Missing user');
    }
    const newName = body.name?.trim();
    if (!newName) {
      throw new UnauthorizedException('Missing name');
    }
    return this.authService.renameCliToken(userId, id, newName);
  }

  private extractIpAddress(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleLogin() {
    return;
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: RequestWithUser, @Res({ passthrough: false }) res: Response) {
    const payload = req.user;
    const user = await this.authService.findOrCreateFromGoogle(payload);
    const projectAccessToken = this.authService.issueProjectAccessToken(user);
    const { refreshToken: projectRefreshToken } =
      await this.authService.issueAndStoreProjectRefreshToken(user);

    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN;

    res.cookie('access_token', projectAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'none',
      ...(cookieDomain && { domain: cookieDomain }),
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', projectRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'none',
      ...(cookieDomain && { domain: cookieDomain }),
      path: '/',
      maxAge: Number(process.env.JWT_REFRESH_DAYS ?? 30) * 24 * 60 * 60 * 1000,
    });

    const frontendUrl = (process.env.ORCA_FRONTEND_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

    const rawState = (req as any).query?.state as string | undefined;
    const state = rawState ? String(rawState) : undefined;
    let safePath = '/dashboard';

    if (state) {
      if (state.startsWith('/')) {
        safePath = state;
      } else {
        safePath = `/${state}`;
      }
    }

    this.logger.log(`[Google Callback] rawState: ${rawState}, safePath: ${safePath}`);

    res.redirect(`${frontendUrl}${safePath}`);
  }

  @Post('refresh')
  async refresh(
    @Req() req: RequestWithCookies,
    @Body() body: RefreshBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = body.refreshToken ?? req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const rotated = await this.authService.rotateRefreshToken(refreshToken);

    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN;

    res.cookie('access_token', rotated.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      ...(cookieDomain && { domain: cookieDomain }),
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', rotated.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      ...(cookieDomain && { domain: cookieDomain }),
      path: '/api/v1/auth',
      maxAge: Number(process.env.JWT_REFRESH_DAYS ?? 30) * 24 * 60 * 60 * 1000,
    });

    return { ok: true };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      throw new UnauthorizedException('Missing user');
    }

    await this.authService.clearRefreshToken(userId);

    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN;

    res.cookie('access_token', '', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      ...(cookieDomain && { domain: cookieDomain }),
      path: '/',
      maxAge: 0,
    });

    res.cookie('refresh_token', '', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      ...(cookieDomain && { domain: cookieDomain }),
      path: '/api/v1/auth',
      maxAge: 0,
    });

    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      throw new UnauthorizedException('Missing user');
    }

    const user = await this.authService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { user: new UserResponseDto(user) };
  }
}
