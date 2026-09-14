import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import * as crypto from 'crypto';
import { HmacSignatureGuard } from './hmac-signature.guard';

describe('HmacSignatureGuard', () => {
  let guard: HmacSignatureGuard;
  const secret = 'test_secret_key_12345';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HmacSignatureGuard,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue: any) => {
              if (key === 'webhook.secret') return secret;
              if (key === 'webhook.toleranceSeconds') return 300;
              return defaultValue;
            },
          },
        },
      ],
    }).compile();

    guard = module.get<HmacSignatureGuard>(HmacSignatureGuard);
  });

  function createMockContext(headers: Record<string, string>, body: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          body,
          rawBody: Buffer.from(JSON.stringify(body)),
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow request with valid HMAC-SHA256 signature', () => {
    const body = { event: 'payment_intent.succeeded', amount: 5000 };
    const rawPayload = JSON.stringify(body);
    const signature = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');

    const context = createMockContext(
      {
        'x-signature': signature,
      },
      body,
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject request with invalid signature', () => {
    const body = { event: 'payment_intent.succeeded', amount: 5000 };
    const context = createMockContext(
      {
        'x-signature': 'invalid_signature_hash_1234567890abcdef',
      },
      body,
    );

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject request when signature header is missing', () => {
    const body = { event: 'payment_intent.succeeded' };
    const context = createMockContext({}, body);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject request if timestamp tolerance is exceeded', () => {
    const body = { event: 'payment_intent.succeeded' };
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago!
    const rawPayload = JSON.stringify(body);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${expiredTimestamp}.${rawPayload}`)
      .digest('hex');

    const context = createMockContext(
      {
        'x-signature': signature,
        'x-timestamp': expiredTimestamp.toString(),
      },
      body,
    );

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
