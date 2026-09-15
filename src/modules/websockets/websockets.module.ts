import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationGateway } from './gateways/notification.gateway';
import { DeviceSubscription } from '../notifications/entities/device-subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceSubscription])],
  providers: [NotificationGateway],
  exports: [NotificationGateway],
})
export class WebSocketsModule {}
