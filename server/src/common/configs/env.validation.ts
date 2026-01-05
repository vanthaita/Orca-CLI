import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync, IsOptional } from 'class-validator';

enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
}

export class EnvironmentVariables {
    @IsEnum(Environment)
    @IsOptional()
    NODE_ENV: Environment = Environment.Development;

    @IsNumber()
    @IsOptional()
    PORT: number = 8000;

    @IsString()
    @IsOptional()
    API_PREFIX: string = 'api/v1';

    @IsString()
    DB_HOST: string;

    @IsNumber()
    DB_PORT: number;

    @IsString()
    DB_USER: string;

    @IsString()
    DB_PASSWORD: string;

    @IsString()
    DB_NAME: string;

    @IsOptional()
    @IsString()
    TYPEORM_SYNC: string;

    @IsOptional()
    @IsString()
    CORS_ORIGIN: string;

    @IsOptional()
    @IsString()
    ORCA_FRONTEND_URL: string;

    @IsOptional()
    @IsString()
    CORS_METHODS: string;

    @IsOptional()
    @IsString()
    CORS_EXPOSED_HEADERS: string;

    @IsOptional()
    @IsNumber()
    CORS_MAX_AGE: number;

    @IsOptional()
    @IsString()
    CORS_CREDENTIALS: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(
        EnvironmentVariables,
        config,
        { enableImplicitConversion: true },
    );
    const errors = validateSync(validatedConfig, { skipMissingProperties: false });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
}
