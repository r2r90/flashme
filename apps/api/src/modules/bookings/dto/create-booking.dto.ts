import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'flash-uuid-here' })
  @IsUUID()
  flashId!: string;

  @ApiProperty({ example: '2026-06-15T14:00:00.000Z' })
  @IsDateString()
  scheduledAt!: string;
}
