import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AiService } from './ai.service';
import * as aiTypes from './ai.types';
import { CliTokenGuard } from './cli-token.guard';
import { User } from '../auth/entities/user.entity';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @UseGuards(CliTokenGuard)
  async chat(
    @Req() req: Request,
    @Body() body: aiTypes.AiChatRequest,
  ): Promise<aiTypes.AiChatResponse> {
    const user = (req as any).user as User | undefined;
    if (!user) {
      throw new UnauthorizedException('Missing user');
    }
    return this.aiService.chat(user.id, body);
  }
}
