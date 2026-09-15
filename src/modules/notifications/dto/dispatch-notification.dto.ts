import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsObject, IsOptional } from 'class-validator';
import { DeliveryChannel } from '../enums/delivery-channel.enum';

export class DispatchNotificationDto {
  @ApiProperty({ example: 'usr_882910' })
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({ enum: DeliveryChannel, default: DeliveryChannel.IN_APP_SOCKET })
  @IsEnum(DeliveryChannel)
  @IsOptional()
  channel?: DeliveryChannel;

  @ApiProperty({ example: 'PAYMENT_SUCCEEDED' })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiProperty({ example: 'Payment Verified' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: {
      orderId: 'ORD-99182',
      amount: 4999,
      currency: 'INR',
      receiptUrl: 'https://cdn.example.com/receipt.pdf',
    },
  })
  @IsObject()
  payload: Record<string, any>;

  @ApiPropertyOptional({ example: 'idemp-tx-992182019' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
