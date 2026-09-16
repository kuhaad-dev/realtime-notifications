import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RedisIoAdapter } from './modules/websockets/adapters/redis-io.adapter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Crucial for HMAC signature verification
  });

  const configService = app.get(ConfigService);

  // Setup Redis-backed Socket.IO adapter for horizontal multi-instance scaling
  const redisIoAdapter = new RedisIoAdapter(app, configService);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // Global validation & filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.enableCors();
  app.enableShutdownHooks();

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Event-Driven Real-Time Notification Service')
    .setDescription(
      'High-throughput notification engine featuring HMAC signature verification, Redis idempotency deduplication, BullMQ exponential backoff queues, and Socket.IO horizontal multi-node broadcasting via Redis adapter.',
    )
    .setVersion('1.0.0')
    .addTag('Notifications', 'Webhook ingestion, manual dispatch, and audit logging')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('port', 3001);
  await app.listen(port);

  logger.log(`🚀 Notification Engine running on http://localhost:${port}`);
  logger.log(`📖 Swagger API Docs available at http://localhost:${port}/api/docs`);
  logger.log(`⚡ WebSocket Namespace active at ws://localhost:${port}/notifications`);
}

bootstrap();
