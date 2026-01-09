import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);

  app.useLogger(logger);
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(cookieParser());
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  const corsOriginsEnv = configService.get<string>('CORS_ORIGIN');
  const frontendUrlEnv = configService.get<string>('ORCA_FRONTEND_URL');

  const corsOrigins = [
    ...(corsOriginsEnv
      ? corsOriginsEnv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      : ['http://localhost:3000', 'http://127.0.0.1:3000']),
    ...(frontendUrlEnv ? [frontendUrlEnv.trim()] : []),
  ]
    .map((s) => s.replace(/\/+$/, ''))
    .filter(Boolean);

  const allowAnyOrigin = corsOrigins.includes('*');

  const corsMethodsEnv = configService.get<string>('CORS_METHODS');
  const corsMethods = corsMethodsEnv
    ? corsMethodsEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(',')
    : undefined;

  const corsExposedHeadersEnv = configService.get<string>('CORS_EXPOSED_HEADERS');
  const corsExposedHeaders = corsExposedHeadersEnv
    ? corsExposedHeadersEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    : undefined;

  const corsMaxAge = configService.get<number>('CORS_MAX_AGE');
  const corsCredentials =
    (configService.get<string>('CORS_CREDENTIALS') ?? 'true') === 'true';

  if (corsOrigins.length > 0) {
    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        const normalizedOrigin = origin.replace(/\/+$/, '');
        if (allowAnyOrigin || corsOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        return callback(new Error(`Not allowed by CORS: ${origin}`), false);
      },
      credentials: corsCredentials,
      methods: corsMethods,
      exposedHeaders: corsExposedHeaders,
      maxAge: corsMaxAge,
    });
  }

  const port = configService.get<number>('PORT') || 8000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Server running on http://localhost:${port}/${apiPrefix}`);
}
bootstrap();
