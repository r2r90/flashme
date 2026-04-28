import { ApiProperty } from '@nestjs/swagger';
import { FlashStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateFlashStatusDto {
  @ApiProperty({ enum: FlashStatus, example: FlashStatus.BOOKED })
  @IsEnum(FlashStatus)
  status!: FlashStatus;
}
