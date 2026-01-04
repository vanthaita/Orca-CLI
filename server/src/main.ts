import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // Simple HTTP Request Logger
  app.use((req, res, next) => {
    console.log(`[Incoming Request] ${req.method} ${req.originalUrl}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('  [Body]:', JSON.stringify(req.body, null, 2));
    }

    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `[Response] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
      );
    });

    next();
  });

  const apiPrefix = process.env.API_PREFIX ?? 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  const corsOriginEnv = process.env.CORS_ORIGIN;
  const corsOrigins = corsOriginEnv
    ? corsOriginEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    : ['http://localhost:3000', 'http://127.0.0.1:3000']; // Default to localhost:3000 if not set

  console.log('CORS Origins:', corsOrigins);


  const corsMethodsEnv = process.env.CORS_METHODS;
  const corsMethods = corsMethodsEnv
    ? corsMethodsEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(',')
    : undefined;

  const corsExposedHeadersEnv = process.env.CORS_EXPOSED_HEADERS;
  const corsExposedHeaders = corsExposedHeadersEnv
    ? corsExposedHeadersEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    : undefined;

  const corsMaxAgeEnv = process.env.CORS_MAX_AGE;
  const corsMaxAge = corsMaxAgeEnv ? Number(corsMaxAgeEnv) : undefined;

  const corsCredentials = (process.env.CORS_CREDENTIALS ?? 'true') === 'true';

  if (corsOrigins) {
    app.enableCors({
      origin: corsOrigins,
      credentials: corsCredentials,
      methods: corsMethods,
      exposedHeaders: corsExposedHeaders,
      maxAge: corsMaxAge,
    });
  }

  const port = Number(process.env.PORT ?? 8000);
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on http://localhost:${port}/${apiPrefix}`);
}
bootstrap();
