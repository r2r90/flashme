import { IsUUID, IsDateString, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  flashId!: string;

  @IsString()
  tenantId!: string;

  @IsDateString()
  scheduledAt!: string;
}
