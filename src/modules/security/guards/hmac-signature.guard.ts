import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';

@Injectable()
export class HmacSignatureGuard implements CanActivate {
  private readonly logger = new Logger(HmacSignatureGuard.name);
  private readonly secret: string;
  private readonly toleranceSeconds: number;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<string>(
      'webhook.secret',
      'whsec_09a1f28b7e654321cba9876543210fed',
    );
    this.toleranceSeconds = this.configService.get<number>(
      'webhook.toleranceSeconds',
      300,
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const signatureHeader =
      (request.headers['x-hub-signature-256'] as string) ||
      (request.headers['x-signature'] as string) ||
      (request.headers['stripe-signature'] as string);

    if (!signatureHeader) {
      this.logger.warn(`[HMAC_REJECTED] Missing webhook signature header`);
      throw new UnauthorizedException('Missing webhook signature header');
    }

    const timestampHeader = request.headers['x-timestamp'] as string;
    if (timestampHeader) {
      const requestTime = parseInt(timestampHeader, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTime - requestTime) > this.toleranceSeconds) {
        this.logger.warn(`[HMAC_REJECTED] Signature timestamp outside tolerance window`);
        throw new UnauthorizedException('Webhook timestamp expired or out of tolerance window');
      }
    }

    // Determine payload to hash
    const rawPayload = (request as any).rawBody
      ? (request as any).rawBody.toString('utf8')
      : JSON.stringify(request.body);

    const payloadToSign = timestampHeader
      ? `${timestampHeader}.${rawPayload}`
      : rawPayload;

    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(payloadToSign)
      .digest('hex');

    // Extract signature hash if formatted as t=...,v1=... or sha256=...
    let cleanSignature = signatureHeader;
    if (cleanSignature.startsWith('sha256=')) {
      cleanSignature = cleanSignature.substring(7);
    } else if (cleanSignature.includes('v1=')) {
      const match = cleanSignature.match(/v1=([a-fA-F0-9]+)/);
      if (match) cleanSignature = match[1];
    }

    // Constant-time comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(cleanSignature, 'hex');

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      this.logger.warn(`[HMAC_REJECTED] Invalid signature verification failed`);
      throw new UnauthorizedException('Invalid webhook signature verification');
    }

    (request as any).webhookVerified = true;
    return true;
  }
}
