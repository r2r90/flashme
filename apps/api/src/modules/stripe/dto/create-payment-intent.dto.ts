import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 'booking-uuid-here' })
  @IsString()
  @IsNotEmpty()
  bookingId!: string;
}
