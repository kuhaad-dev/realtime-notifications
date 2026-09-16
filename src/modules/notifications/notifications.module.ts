import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { NotificationLog } from './entities/notification-log.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { DeviceSubscription } from './entities/device-subscription.entity';
import {
  NotificationsService,
  NOTIFICATION_QUEUE,
} from './services/notifications.service';
import { NotificationDeliveryProcessor } from './processors/notification-delivery.processor';
import { NotificationsController } from './controllers/notifications.controller';
import { WebSocketsModule } from '../websockets/websockets.module';
import { HmacSignatureGuard } from '../security/guards/hmac-signature.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationLog,
      WebhookEvent,
      DeviceSubscription,
    ]),
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE,
    }),
    WebSocketsModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationDeliveryProcessor,
    HmacSignatureGuard,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
