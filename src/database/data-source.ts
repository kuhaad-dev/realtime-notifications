import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { NotificationLog } from '../modules/notifications/entities/notification-log.entity';
import { WebhookEvent } from '../modules/notifications/entities/webhook-event.entity';
import { DeviceSubscription } from '../modules/notifications/entities/device-subscription.entity';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgrespassword',
  database: process.env.DB_DATABASE || 'notifications_db',
  entities: [NotificationLog, WebhookEvent, DeviceSubscription],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
