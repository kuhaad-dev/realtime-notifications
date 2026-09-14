import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { IdempotencyService } from '../services/idempotency.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(private readonly idempotencyService: IdempotencyService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();

    const idempotencyKey =
      (request.headers['x-idempotency-key'] as string) ||
      (request.headers['idempotency-key'] as string) ||
      request.body?.idempotencyKey ||
      request.body?.eventId;

    if (!idempotencyKey) {
      // No idempotency key provided; continue standard processing
      return next.handle();
    }

    // 1. Check for previously cached response
    const cachedResponse = await this.idempotencyService.getCachedResponse(idempotencyKey);
    if (cachedResponse) {
      this.logger.log(`[IDEMPOTENCY_HIT] Returning cached response for key: ${idempotencyKey}`);
      return of(cachedResponse);
    }

    // 2. Acquire lock in Redis
    const lockAcquired = await this.idempotencyService.acquireLock(idempotencyKey);
    if (!lockAcquired) {
      throw new ConflictException(
        `Duplicate in-flight request detected for idempotency key '${idempotencyKey}'`,
      );
    }

    // 3. Process request and cache output
    return next.handle().pipe(
      tap({
        next: async (response) => {
          await this.idempotencyService.storeResponse(idempotencyKey, response);
        },
        error: async () => {
          await this.idempotencyService.releaseLock(idempotencyKey);
        },
      }),
    );
  }
}
