import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { CliDeviceCode } from './entities/cli-device-code.entity';
import { CliToken } from './entities/cli-token.entity';
import { User } from './entities/user.entity';
import { GoogleUserPayload } from './google.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(CliDeviceCode)
    private readonly cliDeviceCodesRepo: Repository<CliDeviceCode>,
    @InjectRepository(CliToken)
    private readonly cliTokensRepo: Repository<CliToken>,
    private readonly jwtService: JwtService,
  ) { }

  async findOrCreateFromGoogle(payload: GoogleUserPayload): Promise<User> {
    const existing = await this.usersRepo.findOne({
      where: [{ googleId: payload.googleId }, ...(payload.email ? [{ email: payload.email }] : [])],
    });

    if (existing) {
      const updated = this.usersRepo.merge(existing, {
        googleId: payload.googleId,
        email: payload.email ?? existing.email,
        name: payload.name ?? existing.name,
        picture: payload.picture ?? existing.picture,
      });
      return this.usersRepo.save(updated);
    }

    const created = this.usersRepo.create({
      googleId: payload.googleId,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    });

    return this.usersRepo.save(created);
  }

  async findUserById(userId: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id: userId } });
  }

  issueProjectAccessToken(user: User): string {
    return this.jwtService.sign({ sub: user.id });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateUserCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 8; i++) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
  }

  async startCliLogin(): Promise<{
    deviceCode: string;
    userCode: string;
    verificationUrl: string;
    expiresIn: number;
    interval: number;
  }> {
    const deviceCode = randomBytes(48).toString('base64url');
    const deviceCodeHash = this.hashToken(deviceCode);

    const userCode = this.generateUserCode();

    const expiresMinutes = Number(process.env.CLI_DEVICE_EXPIRES_MIN ?? 10);
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    const record = this.cliDeviceCodesRepo.create({
      deviceCodeHash,
      userCode,
      userId: null,
      approvedAt: null,
      expiresAt,
    });

    await this.cliDeviceCodesRepo.save(record);

    const frontendUrl = process.env.ORCA_FRONTEND_URL ?? 'http://localhost:3000';
    const verificationUrl = `${frontendUrl.replace(/\/+$/, '')}/cli/verify?userCode=${encodeURIComponent(userCode)}`;
    const interval = Number(process.env.CLI_DEVICE_POLL_INTERVAL_SEC ?? 2);

    return {
      deviceCode,
      userCode,
      verificationUrl,
      expiresIn: expiresMinutes * 60,
      interval,
    };
  }

  async approveCliLogin(userId: string, userCode: string): Promise<{ ok: true }> {
    const code = userCode.trim().toUpperCase();
    this.logger.log(`approveCliLogin called for user ${userId} with code ${code}`);
    const device = await this.cliDeviceCodesRepo.findOne({ where: { userCode: code } });
    this.logger.log(`Device found: ${!!device}`);

    if (!device) {
      throw new UnauthorizedException('Invalid user code');
    }

    if (device.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('User code expired');
    }

    if (device.approvedAt) {
      return { ok: true };
    }

    device.userId = userId;
    device.approvedAt = new Date();
    await this.cliDeviceCodesRepo.save(device);
    return { ok: true };
  }

  async pollCliLogin(deviceCode: string): Promise<
    | { status: 'authorization_pending'; interval: number }
    | { status: 'expired' }
    | { status: 'ok'; accessToken: string; expiresIn: number }
  > {
    const interval = Number(process.env.CLI_DEVICE_POLL_INTERVAL_SEC ?? 2);
    const deviceCodeHash = this.hashToken(deviceCode);
    const device = await this.cliDeviceCodesRepo.findOne({ where: { deviceCodeHash } });

    if (!device) {
      return { status: 'expired' };
    }

    if (device.expiresAt.getTime() < Date.now()) {
      await this.cliDeviceCodesRepo.delete({ id: device.id });
      return { status: 'expired' };
    }

    if (!device.approvedAt || !device.userId) {
      return { status: 'authorization_pending', interval };
    }

    const rawToken = randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(rawToken);

    const tokenDays = Number(process.env.CLI_TOKEN_DAYS ?? 30);
    const expiresAt = new Date(Date.now() + tokenDays * 24 * 60 * 60 * 1000);

    const label = 'cli';
    const token = this.cliTokensRepo.create({
      tokenHash,
      userId: device.userId,
      expiresAt,
      revokedAt: null,
      label,
    });

    await this.cliTokensRepo.save(token);

    // Consume device code so it can't mint multiple tokens
    await this.cliDeviceCodesRepo.delete({ id: device.id });

    return { status: 'ok', accessToken: rawToken, expiresIn: tokenDays * 24 * 60 * 60 };
  }

  async listCliTokens(userId: string): Promise<CliToken[]> {
    return this.cliTokensRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeCliToken(userId: string, tokenId: string): Promise<{ ok: true }> {
    const token = await this.cliTokensRepo.findOne({ where: { id: tokenId, userId } });
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }
    if (!token.revokedAt) {
      token.revokedAt = new Date();
      await this.cliTokensRepo.save(token);
    }
    return { ok: true };
  }

  async validateCliToken(rawToken: string): Promise<{ userId: string } | null> {
    const tokenHash = this.hashToken(rawToken);
    const token = await this.cliTokensRepo.findOne({ where: { tokenHash } });
    if (!token) return null;
    if (token.revokedAt) return null;
    if (token.expiresAt.getTime() < Date.now()) return null;
    return { userId: token.userId };
  }

  async issueAndStoreProjectRefreshToken(user: User): Promise<{ refreshToken: string }> {
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshDays = Number(process.env.JWT_REFRESH_DAYS ?? 30);
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    user.projectRefreshTokenHash = this.hashToken(refreshToken);
    user.projectRefreshTokenExpiresAt = expiresAt;
    await this.usersRepo.save(user);

    return { refreshToken };
  }

  async rotateRefreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const hashed = this.hashToken(refreshToken);
    const user = await this.usersRepo.findOne({ where: { projectRefreshTokenHash: hashed } });

    if (!user || !user.projectRefreshTokenExpiresAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (user.projectRefreshTokenExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const accessToken = this.issueProjectAccessToken(user);
    const next = await this.issueAndStoreProjectRefreshToken(user);
    return { accessToken, refreshToken: next.refreshToken };
  }
}
