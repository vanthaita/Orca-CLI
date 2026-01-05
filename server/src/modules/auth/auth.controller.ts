import { Body, Controller, Get, Param, Post, Req, Res, UnauthorizedException, UseGuards, Logger } from '@nestjs/common';
import type { Request } from 'express';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { GoogleUserPayload } from './google.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

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

type CliPollBody = { deviceCode?: string };
type CliPollResponse =
  | { status: 'authorization_pending'; interval: number }
  | { status: 'expired' }
  | { status: 'ok'; accessToken: string; expiresIn: number };

type CliVerifyBody = { userCode?: string };

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) { }

  @Get('cli/start')
  async cliStart(): Promise<CliStartResponse> {
    return this.authService.startCliLogin();
  }

  @Post('cli/poll')
  async cliPoll(@Body() body: CliPollBody): Promise<CliPollResponse> {
    const deviceCode = body.deviceCode?.trim();
    if (!deviceCode) {
      throw new UnauthorizedException('Missing deviceCode');
    }
    return this.authService.pollCliLogin(deviceCode);
  }

  @Post('cli/verify')
  @UseGuards(JwtAuthGuard)
  async cliVerify(@Req() req: Request, @Body() body: CliVerifyBody) {
    this.logger.log(`cliVerify endpoint hit`);
    const userCode = body.userCode?.trim();
    if (!userCode) {
      throw new UnauthorizedException('Missing userCode');
    }

    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) {
      throw new UnauthorizedException('Missing user');
    }

    return this.authService.approveCliLogin(userId, userCode);
  }

  @Get('cli/tokens')
  @UseGuards(JwtAuthGuard)
  async cliTokens(@Req() req: Request) {
    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) {
      throw new UnauthorizedException('Missing user');
    }
    const tokens = await this.authService.listCliTokens(userId);

    return {
      tokens: tokens.map((t) => ({
        id: t.id,
        label: t.label,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt,
        revokedAt: t.revokedAt,
      })),
    };
  }

  @Post('cli/tokens/:id/revoke')
  @UseGuards(JwtAuthGuard)
  async cliRevoke(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) {
      throw new UnauthorizedException('Missing user');
    }
    return this.authService.revokeCliToken(userId, id);
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

    res.cookie('accessToken', projectAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      ...(cookieDomain && { domain: cookieDomain }), // Only set domain if defined
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', projectRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      ...(cookieDomain && { domain: cookieDomain }), // Only set domain if defined
      path: '/api/v1/auth',
      maxAge: Number(process.env.JWT_REFRESH_DAYS ?? 30) * 24 * 60 * 60 * 1000,
    });

    const frontendUrl = process.env.ORCA_FRONTEND_URL ?? 'http://localhost:3000';

    const rawState = (req as any).query?.state as string | undefined;
    const state = rawState ? String(rawState) : undefined;
    const safePath = state && state.startsWith('/') ? state : '/dashboard';
    res.redirect(`${frontendUrl}${safePath}`);
  }

  @Post('refresh')
  async refresh(
    @Req() req: RequestWithCookies,
    @Body() body: RefreshBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = body.refreshToken ?? req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const rotated = await this.authService.rotateRefreshToken(refreshToken);

    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN;

    res.cookie('accessToken', rotated.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      ...(cookieDomain && { domain: cookieDomain }), // Only set domain if defined
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', rotated.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      ...(cookieDomain && { domain: cookieDomain }), // Only set domain if defined
      path: '/api/v1/auth',
      maxAge: Number(process.env.JWT_REFRESH_DAYS ?? 30) * 24 * 60 * 60 * 1000,
    });

    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) {
      throw new UnauthorizedException('Missing user');
    }

    const user = await this.authService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { user };
  }
}
