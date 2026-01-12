import { Controller, Get } from '@nestjs/common';
import { ReleaseService, ReleaseInfoDto } from './release.service';

@Controller('releases')
export class ReleaseController {
  constructor(private readonly releaseService: ReleaseService) {}

  @Get('latest')
  getLatestRelease(): ReleaseInfoDto {
    return this.releaseService.getLatestRelease();
  }
}
