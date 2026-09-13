import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('webhook_events')
@Index(['provider', 'eventId'])
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @Column({ type: 'varchar', length: 150 })
  eventId: string;

  @Column({ type: 'varchar', length: 255 })
  signature: string;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, any>;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'varchar', length: 50, default: 'RECEIVED' })
  status: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
