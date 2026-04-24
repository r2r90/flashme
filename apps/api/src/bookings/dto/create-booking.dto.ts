import { IsUUID, IsDateString } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  flashId!: string;

  @IsUUID()
  clientId!: string;

  @IsDateString()
  scheduledAt!: string;
}
