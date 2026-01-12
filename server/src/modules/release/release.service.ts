import { Injectable } from '@nestjs/common';

export class ReleaseInfoDto {
  version: string;
  url: string;
  notes: string;
}

@Injectable()
export class ReleaseService {
  getLatestRelease(): ReleaseInfoDto {
    return {
      version: '0.1.12',
      url: 'https://github.com/vanthaita/Orca/releases/download/v0.1.12/Orca.msi',
      notes: 'New version with auto-update capability!',
    };
  }
}
