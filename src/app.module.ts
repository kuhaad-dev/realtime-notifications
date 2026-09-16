import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { IdempotencyModule } from './modules/idempotency/idempotency.module';
import { WebSocketsModule } from './modules/websockets/websockets.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ConsoleModule } from './modules/console/console.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
        },
      }),
    }),
    DatabaseModule,
    IdempotencyModule,
    WebSocketsModule,
    NotificationsModule,
    ConsoleModule,
  ],
})
export class AppModule {}
