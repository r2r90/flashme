import { IsUUID, IsDateString } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  flashId!: string;

  @IsDateString()
  scheduledAt!: string;
}
