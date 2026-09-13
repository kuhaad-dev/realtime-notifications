export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  webhook: {
    secret: process.env.WEBHOOK_SECRET || 'whsec_09a1f28b7e654321cba9876543210fed',
    toleranceSeconds: parseInt(process.env.HMAC_TOLERANCE_SECONDS || '300', 10),
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgrespassword',
    database: process.env.DB_DATABASE || 'notifications_db',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  bullmq: {
    concurrency: parseInt(process.env.BULLMQ_CONCURRENCY || '15', 10),
    attempts: parseInt(process.env.BULLMQ_RETRY_ATTEMPTS || '5', 10),
    backoffDelayMs: parseInt(process.env.BULLMQ_BACKOFF_DELAY_MS || '2000', 10),
  },
  idempotency: {
    ttlSeconds: parseInt(process.env.IDEMPOTENCY_TTL_SECONDS || '86400', 10),
  },
});
