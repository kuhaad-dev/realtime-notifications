import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { DeliveryChannel } from '../enums/delivery-channel.enum';

@Entity('notification_logs')
@Index(['recipientId', 'status'])
@Index(['channel', 'createdAt'])
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150 })
  idempotencyKey: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  recipientId: string;

  @Column({
    type: 'enum',
    enum: DeliveryChannel,
    default: DeliveryChannel.IN_APP_SOCKET,
  })
  channel: DeliveryChannel;

  @Column({ type: 'varchar', length: 100 })
  eventType: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deliveredAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
