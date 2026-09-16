import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NOTIFICATION_QUEUE } from '../services/notifications.service';
import { NotificationLog } from '../entities/notification-log.entity';
import { NotificationGateway } from '../../websockets/gateways/notification.gateway';
import { DeliveryStatus } from '../enums/delivery-status.enum';

interface NotificationJobData {
  logId: string;
  recipientId: string;
  channel: string;
  eventType: string;
  title: string;
  payload: Record<string, any>;
}

@Processor(NOTIFICATION_QUEUE)
export class NotificationDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationDeliveryProcessor.name);

  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
    private readonly gateway: NotificationGateway,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<{ delivered: boolean }> {
    const { logId, recipientId, eventType, title, payload } = job.data;
    const attempt = job.attemptsMade + 1;

    this.logger.log(
      `[DELIVERY_WORKER] Processing delivery job ${job.id} for recipient ${recipientId} (Attempt: ${attempt})`,
    );

    const log = await this.logRepo.findOne({ where: { id: logId } });
    if (!log) {
      this.logger.warn(`NotificationLog with id '${logId}' not found, skipping.`);
      return { delivered: false };
    }

    try {
      log.status = DeliveryStatus.PROCESSING;
      log.retryCount = job.attemptsMade;
      await this.logRepo.save(log);

      // Route message via Socket.IO Gateway across Redis adapter
      const message = {
        notificationId: log.id,
        eventType,
        title,
        payload,
        timestamp: new Date().toISOString(),
      };

      // Emit to recipient's personal room
      this.gateway.emitToUser(recipientId, eventType, message);
      // Also emit to general notifications stream for recipient
      this.gateway.emitToUser(recipientId, 'notification', message);

      // Record successful delivery
      log.status = DeliveryStatus.DELIVERED;
      log.deliveredAt = new Date();
      log.errorMessage = null;
      await this.logRepo.save(log);

      this.logger.log(
        `[DELIVERY_SUCCESS] Notification ${logId} successfully routed to user:${recipientId}`,
      );

      return { delivered: true };
    } catch (err) {
      log.status = DeliveryStatus.FAILED;
      log.errorMessage = err.message;
      await this.logRepo.save(log);

      this.logger.error(
        `[DELIVERY_ATTEMPT_FAILED] Failed to deliver ${logId} on attempt ${attempt}: ${err.message}`,
      );

      // Re-throw to trigger BullMQ exponential backoff retry
      throw err;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    if (job.attemptsMade >= (job.opts.attempts || 5)) {
      this.logger.error(
        `[DLQ_EXHAUSTED] Job ${job.id} moved to Dead Letter Queue after ${job.attemptsMade} failed attempts. Error: ${err.message}`,
      );
    }
  }
}
