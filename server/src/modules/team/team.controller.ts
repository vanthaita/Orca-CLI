import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { UnifiedAuthGuard } from '../auth/unified-auth.guard';
import { User } from '../auth/entities/user.entity';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamService } from './team.service';

@Controller('team')
@UseGuards(UnifiedAuthGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  private getUserFromRequest(req: Request): User {
    const user = (req as Request & { user?: User }).user;
    if (!user || !user.id) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createTeam(@Req() req: Request, @Body() dto: CreateTeamDto) {
    const user = this.getUserFromRequest(req);
    return this.teamService.createTeam(user, dto.name);
  }

  @Post('members')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async addMember(@Req() req: Request, @Body() dto: AddMemberDto) {
    const user = this.getUserFromRequest(req);
    return this.teamService.addMember(user, dto.email);
  }

  @Get()
  async getMyTeam(@Req() req: Request) {
    const user = this.getUserFromRequest(req);
    return this.teamService.getMyTeam(user);
  }
}
