import { Injectable } from '@nestjs/common';

export class ReleaseInfoDto {
    version: string;
    url: string;
    notes: string;
}

@Injectable()
export class ReleaseService {
    getLatestRelease(): ReleaseInfoDto {
        // TODO: In a real scenario, this should be read from a database or a manifest file.
        // For now, we hardcode a version just for testing the update flow.
        // The current CLI version is 0.1.11, so we simulate a newer version.
        return {
            version: '0.1.12',
            url: 'https://github.com/vanthaita/Orca/releases/download/v0.1.12/Orca.msi', // Placeholder URL
            notes: 'New version with auto-update capability!',
        };
    }
}
