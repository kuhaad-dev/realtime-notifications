import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class WebhookPayloadDto {
  @ApiProperty({ example: 'evt_stripe_99218a0' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ example: 'payment_intent.succeeded' })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiProperty({ example: 'STRIPE' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({
    example: {
      customerId: 'cus_991829',
      amount: 5000,
      currency: 'usd',
      status: 'succeeded',
    },
  })
  @IsObject()
  data: Record<string, any>;
}
