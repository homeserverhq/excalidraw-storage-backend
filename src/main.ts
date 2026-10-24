import { LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const LOG_LEVELS: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];

function isLogLevel(value: any): value is LogLevel {
  return LOG_LEVELS.includes(value);
}

async function bootstrap() {
  const logLevel = isLogLevel(process.env.LOG_LEVEL)
    ? process.env.LOG_LEVEL
    : 'log';

  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: [logLevel],
  });

  app.setGlobalPrefix(process.env.GLOBAL_PREFIX ?? '/api/v2');

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
