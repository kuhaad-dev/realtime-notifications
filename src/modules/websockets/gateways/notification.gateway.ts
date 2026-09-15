import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceSubscription } from '../../notifications/entities/device-subscription.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private activeConnections = 0;

  constructor(
    @InjectRepository(DeviceSubscription)
    private readonly subscriptionRepo: Repository<DeviceSubscription>,
  ) {}

  async handleConnection(client: Socket) {
    this.activeConnections++;
    const userId = (client.handshake.query.userId as string) || client.handshake.auth?.userId;

    this.logger.log(
      `[SOCKET_CONNECTED] Client connected: ${client.id} (User: ${userId || 'anonymous'}, Total active: ${this.activeConnections})`,
    );

    if (userId) {
      // Automatically join personal user room
      client.join(`user:${userId}`);

      // Record subscription
      try {
        const sub = this.subscriptionRepo.create({
          userId,
          socketId: client.id,
          channels: [`user:${userId}`],
          isActive: true,
          connectedAt: new Date(),
        });
        await this.subscriptionRepo.save(sub);
      } catch (err) {
        this.logger.debug(`Could not persist socket subscription: ${err.message}`);
      }
    }
  }

  async handleDisconnect(client: Socket) {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    this.logger.log(`[SOCKET_DISCONNECTED] Client disconnected: ${client.id}`);

    try {
      await this.subscriptionRepo.update(
        { socketId: client.id },
        { isActive: false, disconnectedAt: new Date() },
      );
    } catch (err) {
      this.logger.debug(`Could not update disconnect record: ${err.message}`);
    }
  }

  @SubscribeMessage('subscribe_channel')
  handleSubscribeChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string },
  ) {
    if (data?.channel) {
      client.join(data.channel);
      this.logger.debug(`Socket ${client.id} joined channel: ${data.channel}`);
      return { status: 'SUBSCRIBED', channel: data.channel };
    }
  }

  @SubscribeMessage('unsubscribe_channel')
  handleUnsubscribeChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string },
  ) {
    if (data?.channel) {
      client.leave(data.channel);
      this.logger.debug(`Socket ${client.id} left channel: ${data.channel}`);
      return { status: 'UNSUBSCRIBED', channel: data.channel };
    }
  }

  emitToUser(userId: string, event: string, payload: any): boolean {
    if (!this.server) return false;
    this.server.to(`user:${userId}`).emit(event, payload);
    return true;
  }

  emitToChannel(channel: string, event: string, payload: any): boolean {
    if (!this.server) return false;
    this.server.to(channel).emit(event, payload);
    return true;
  }

  emitToAll(event: string, payload: any): boolean {
    if (!this.server) return false;
    this.server.emit(event, payload);
    return true;
  }

  getActiveConnectionsCount(): number {
    return this.activeConnections;
  }
}
