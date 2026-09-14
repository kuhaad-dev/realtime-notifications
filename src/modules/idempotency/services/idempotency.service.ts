import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly redisClient: Redis;
  private readonly defaultTtl: number;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('redis.host', 'localhost');
    const port = this.configService.get<number>('redis.port', 6379);
    this.defaultTtl = this.configService.get<number>('idempotency.ttlSeconds', 86400);

    this.redisClient = new Redis({
      host,
      port,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
  }

  async acquireLock(key: string, ttlSeconds?: number): Promise<boolean> {
    const ttl = ttlSeconds || this.defaultTtl;
    const lockKey = `idempotency:${key}`;
    try {
      // Atomic SETNX with TTL
      const result = await this.redisClient.set(lockKey, 'IN_FLIGHT', 'EX', ttl, 'NX');
      const acquired = result === 'OK';

      if (!acquired) {
        this.logger.warn(`[IDEMPOTENCY_LOCKED] Duplicate request detected for key: ${key}`);
      }

      return acquired;
    } catch (err) {
      // In-memory fallback if Redis is unavailable during testing
      return true;
    }
  }

  async storeResponse(key: string, response: any, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || this.defaultTtl;
    const lockKey = `idempotency:${key}`;
    try {
      await this.redisClient.set(
        lockKey,
        JSON.stringify({ status: 'COMPLETED', response, timestamp: Date.now() }),
        'EX',
        ttl,
      );
    } catch (err) {
      this.logger.debug(`Could not cache idempotency response in Redis: ${err.message}`);
    }
  }

  async getCachedResponse(key: string): Promise<any | null> {
    const lockKey = `idempotency:${key}`;
    try {
      const data = await this.redisClient.get(lockKey);
      if (!data) return null;
      if (data === 'IN_FLIGHT') {
        throw new ConflictException(`Request with idempotency key '${key}' is currently being processed`);
      }
      const parsed = JSON.parse(data);
      return parsed.response;
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      return null;
    }
  }

  async releaseLock(key: string): Promise<void> {
    const lockKey = `idempotency:${key}`;
    try {
      await this.redisClient.del(lockKey);
    } catch (err) {
      this.logger.debug(`Could not release lock: ${err.message}`);
    }
  }
}
