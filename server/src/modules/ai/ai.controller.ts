import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AiService } from './ai.service';
import * as aiTypes from './ai.types';
import { CliTokenGuard } from './cli-token.guard';
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @UseGuards(CliTokenGuard)
  async chat(@Req() req: Request, @Body() body: aiTypes.AiChatRequest): Promise<aiTypes.AiChatResponse> {
    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) {
      throw new UnauthorizedException('Missing user');
    }
    return this.aiService.chat(userId, body);
  }
}
