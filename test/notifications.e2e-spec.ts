import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService, NOTIFICATION_QUEUE } from '../src/modules/notifications/services/notifications.service';
import { NotificationLog } from '../src/modules/notifications/entities/notification-log.entity';
import { WebhookEvent } from '../src/modules/notifications/entities/webhook-event.entity';
import { NotificationDeliveryProcessor } from '../src/modules/notifications/processors/notification-delivery.processor';
import { NotificationGateway } from '../src/modules/websockets/gateways/notification.gateway';
import { DeliveryStatus } from '../src/modules/notifications/enums/delivery-status.enum';

describe('Realtime Notification Delivery & Idempotency Pipeline (E2E)', () => {
  let service: NotificationsService;
  let processor: NotificationDeliveryProcessor;
  let gateway: NotificationGateway;

  const mockLogs = new Map<string, NotificationLog>();
  const mockEnqueuedJobs: any[] = [];

  const mockLogRepo = {
    findOne: jest.fn().mockImplementation(({ where }) => {
      if (where.idempotencyKey) {
        for (const log of mockLogs.values()) {
          if (log.idempotencyKey === where.idempotencyKey) return log;
        }
      }
      if (where.id) {
        return mockLogs.get(where.id) || null;
      }
      return null;
    }),
    create: jest.fn().mockImplementation((data) => ({
      ...data,
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (log) => {
      mockLogs.set(log.id, log);
      return log;
    }),
  };

  const mockWebhookRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((d) => ({ ...d, id: 'wh-1' })),
    save: jest.fn().mockImplementation(async (d) => d),
  };

  const mockQueue = {
    add: jest.fn().mockImplementation(async (name, data, opts) => {
      mockEnqueuedJobs.push({ name, data, opts });
      return { id: opts.jobId };
    }),
  };

  const mockGateway = {
    emitToUser: jest.fn().mockReturnValue(true),
    getActiveConnectionsCount: jest.fn().mockReturnValue(1),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        NotificationDeliveryProcessor,
        {
          provide: 'NotificationLogRepository',
          useValue: mockLogRepo,
        },
        {
          provide: 'WebhookEventRepository',
          useValue: mockWebhookRepo,
        },
        {
          provide: `BullQueue_${NOTIFICATION_QUEUE}`,
          useValue: mockQueue,
        },
        {
          provide: NotificationGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    processor = module.get<NotificationDeliveryProcessor>(NotificationDeliveryProcessor);
    gateway = module.get<NotificationGateway>(NotificationGateway);
  });

  it('should dispatch notification, persist log, and enqueue to BullMQ with exponential backoff', async () => {
    const result = await service.dispatch({
      recipientId: 'usr-vip-99',
      eventType: 'PAYMENT_SUCCEEDED',
      title: 'Payment Received',
      payload: { amount: 2500, currency: 'INR' },
      idempotencyKey: 'idemp-unique-001',
    });

    expect(result.id).toBeDefined();
    expect(mockEnqueuedJobs.length).toBe(1);
    expect(mockEnqueuedJobs[0].opts.attempts).toBe(5);
    expect(mockEnqueuedJobs[0].opts.backoff.type).toBe('exponential');
  });

  it('should suppress duplicate dispatch when identical idempotency key is submitted', async () => {
    const duplicateAttempt = await service.dispatch({
      recipientId: 'usr-vip-99',
      eventType: 'PAYMENT_SUCCEEDED',
      title: 'Payment Received',
      payload: { amount: 2500, currency: 'INR' },
      idempotencyKey: 'idemp-unique-001', // Repeated!
    });

    // Should return existing record without adding a new job to the queue
    expect(duplicateAttempt.idempotencyKey).toBe('idemp-unique-001');
    expect(mockEnqueuedJobs.length).toBe(1); // Queue count unchanged!
  });

  it('should process BullMQ delivery job and route to Socket.IO gateway', async () => {
    const job = {
      id: 'job-1',
      attemptsMade: 0,
      opts: { attempts: 5 },
      data: {
        logId: Array.from(mockLogs.keys())[0],
        recipientId: 'usr-vip-99',
        channel: 'IN_APP_SOCKET',
        eventType: 'PAYMENT_SUCCEEDED',
        title: 'Payment Received',
        payload: { amount: 2500 },
      },
    } as any;

    const deliveryResult = await processor.process(job);

    expect(deliveryResult.delivered).toBe(true);
    expect(gateway.emitToUser).toHaveBeenCalledWith(
      'usr-vip-99',
      'PAYMENT_SUCCEEDED',
      expect.objectContaining({
        eventType: 'PAYMENT_SUCCEEDED',
      }),
    );
  });
});
