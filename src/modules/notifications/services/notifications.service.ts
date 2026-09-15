import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { NotificationLog } from '../entities/notification-log.entity';
import { WebhookEvent } from '../entities/webhook-event.entity';
import { DispatchNotificationDto } from '../dto/dispatch-notification.dto';
import { WebhookPayloadDto } from '../dto/webhook-payload.dto';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { DeliveryChannel } from '../enums/delivery-channel.enum';

export const NOTIFICATION_QUEUE = 'notification-delivery-queue';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
    @InjectRepository(WebhookEvent)
    private readonly webhookRepo: Repository<WebhookEvent>,
    @InjectQueue(NOTIFICATION_QUEUE)
    private readonly queue: Queue,
  ) {}

  async dispatch(dto: DispatchNotificationDto): Promise<NotificationLog> {
    const idempotencyKey = dto.idempotencyKey || `auto-${uuidv4()}`;

    // Check for existing notification with same idempotency key
    const existing = await this.logRepo.findOne({ where: { idempotencyKey } });
    if (existing) {
      this.logger.warn(
        `[IDEMPOTENCY_SUPPRESSED] Notification with idempotency key '${idempotencyKey}' already processed`,
      );
      return existing;
    }

    const log = this.logRepo.create({
      idempotencyKey,
      recipientId: dto.recipientId,
      channel: dto.channel || DeliveryChannel.IN_APP_SOCKET,
      eventType: dto.eventType,
      title: dto.title,
      payload: dto.payload,
      status: DeliveryStatus.PENDING,
    });

    const savedLog = await this.logRepo.save(log);

    // Enqueue to BullMQ with exponential backoff configuration
    await this.queue.add(
      'deliver-notification',
      {
        logId: savedLog.id,
        recipientId: savedLog.recipientId,
        channel: savedLog.channel,
        eventType: savedLog.eventType,
        title: savedLog.title,
        payload: savedLog.payload,
      },
      {
        jobId: `job-notify-${savedLog.id}`,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep in Dead-Letter Queue (DLQ) for inspection
      },
    );

    this.logger.log(
      `[NOTIFICATION_ENQUEUED] Job enqueued for recipient ${dto.recipientId} (Log ID: ${savedLog.id})`,
    );

    return savedLog;
  }

  async ingestWebhook(
    payload: WebhookPayloadDto,
    signature: string,
    headers: Record<string, any>,
  ): Promise<{ status: string; webhookEventId: string; enqueuedLogId: string }> {
    const existing = await this.webhookRepo.findOne({
      where: { provider: payload.provider, eventId: payload.eventId },
    });

    if (existing) {
      this.logger.warn(
        `[WEBHOOK_DUPLICATE] Event ${payload.eventId} from ${payload.provider} already received`,
      );
      return {
        status: 'DUPLICATE_ACKNOWLEDGED',
        webhookEventId: existing.id,
        enqueuedLogId: 'previously_enqueued',
      };
    }

    const webhookEvent = this.webhookRepo.create({
      provider: payload.provider,
      eventId: payload.eventId,
      signature,
      headers,
      payload: payload.data,
      verified: true,
      status: 'PROCESSED',
    });

    const savedEvent = await this.webhookRepo.save(webhookEvent);

    // Automatically map and route webhook event to a notification delivery job
    const recipientId =
      payload.data?.customerId ||
      payload.data?.userId ||
      payload.data?.recipientId ||
      'broadcast-system';

    const notification = await this.dispatch({
      recipientId,
      eventType: payload.eventType,
      title: `Webhook: ${payload.eventType}`,
      payload: {
        provider: payload.provider,
        eventId: payload.eventId,
        ...payload.data,
      },
      idempotencyKey: `webhook-${payload.provider}-${payload.eventId}`,
    });

    return {
      status: 'ACCEPTED',
      webhookEventId: savedEvent.id,
      enqueuedLogId: notification.id,
    };
  }

  async getLogs(recipientId?: string): Promise<NotificationLog[]> {
    if (recipientId) {
      return await this.logRepo.find({
        where: { recipientId },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    }
    return await this.logRepo.find({
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getLogById(id: string): Promise<NotificationLog | null> {
    return await this.logRepo.findOne({ where: { id } });
  }
}
