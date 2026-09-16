import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from '../services/notifications.service';
import { DispatchNotificationDto } from '../dto/dispatch-notification.dto';
import { WebhookPayloadDto } from '../dto/webhook-payload.dto';
import { HmacSignatureGuard } from '../../security/guards/hmac-signature.guard';
import { IdempotencyInterceptor } from '../../idempotency/interceptors/idempotency.interceptor';
import { NotificationGateway } from '../../websockets/gateways/notification.gateway';

@ApiTags('Notifications')
@Controller('notifications')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly gateway: NotificationGateway,
  ) {}

  @Post('dispatch')
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({
    summary: 'Dispatch notification event via BullMQ queue to Socket.IO',
    description:
      'Enqueues notification with exponential backoff retries, Redis idempotency deduplication, and horizontal Redis-adapter Socket.IO routing.',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Unique key to guarantee exactly-once processing',
  })
  @ApiResponse({ status: 201, description: 'Notification enqueued for real-time delivery' })
  @ApiResponse({ status: 409, description: 'Duplicate request in-flight' })
  async dispatchNotification(@Body() dto: DispatchNotificationDto) {
    return await this.notificationsService.dispatch(dto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(HmacSignatureGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({
    summary: 'Ingest external webhook event with HMAC-SHA256 signature verification',
    description:
      'Validates timing-safe HMAC-SHA256 signature, deduplicates via Redis idempotency key, records audit event in PostgreSQL, and enqueues real-time notification delivery.',
  })
  @ApiHeader({
    name: 'x-signature',
    required: true,
    description: 'HMAC-SHA256 signature of request payload',
  })
  @ApiHeader({
    name: 'x-timestamp',
    required: false,
    description: 'UNIX epoch seconds timestamp to prevent replay attacks',
  })
  @ApiResponse({ status: 202, description: 'Webhook verified and routed to notification delivery' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid signature or timestamp tolerance expired' })
  async ingestWebhook(
    @Body() payload: WebhookPayloadDto,
    @Headers('x-signature') signature: string,
    @Headers() headers: Record<string, any>,
  ) {
    return await this.notificationsService.ingestWebhook(payload, signature, headers);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Retrieve delivery audit logs' })
  @ApiQuery({ name: 'recipientId', required: false, type: String })
  async getLogs(@Query('recipientId') recipientId?: string) {
    return await this.notificationsService.getLogs(recipientId);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Real-time WebSocket connection and delivery metrics' })
  async getMetrics() {
    return {
      activeSocketConnections: this.gateway.getActiveConnectionsCount(),
      systemTime: new Date().toISOString(),
      nodeInstance: process.env.NODE_APP_INSTANCE || 'node-instance-1',
    };
  }
}
