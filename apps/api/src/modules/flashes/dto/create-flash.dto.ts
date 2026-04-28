import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateFlashDto {
  @ApiProperty({ example: 'a19123bc-bb0b-46c5-b922-193c6e9a57c8' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ example: 'b29123bc-bb0b-46c5-b922-193c6e9a57c9' })
  @IsUUID()
  artistId!: string;

  @ApiProperty({ example: 'Serpent tribal' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Bold black tribal snake design' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'https://bucket.s3.eu-west-3.amazonaws.com/flashes/abc.jpg',
  })
  @IsUrl()
  imageUrl!: string;

  @ApiProperty({ example: 5000, description: 'Price in cents (5000 = 50€)' })
  @IsInt()
  @Min(1)
  price!: number;
}
