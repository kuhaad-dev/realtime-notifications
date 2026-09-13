import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('device_subscriptions')
@Index(['userId', 'isActive'])
@Index(['socketId'])
export class DeviceSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  socketId: string;

  @Column({ type: 'varchar', length: 100, default: 'node-cluster-main' })
  nodeInstanceId: string;

  @Column({ type: 'text', array: true, default: '{}' })
  channels: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  connectedAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  disconnectedAt: Date;
}
