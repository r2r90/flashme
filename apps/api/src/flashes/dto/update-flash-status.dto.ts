import { IsEnum } from 'class-validator';
import { FlashStatus } from '@prisma/client';

export class UpdateFlashStatusDto {
  @IsEnum(FlashStatus)
  status!: FlashStatus;
}
