import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class GetUploadUrlDto {
  @ApiProperty({
    example: 'flashes',
    description: 'Allowed: flashes, avatars, studios',
  })
  @IsString()
  folder!: string;

  @ApiProperty({
    example: 'image/jpeg',
    enum: ['image/jpeg', 'image/png', 'image/webp'],
  })
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  mimeType!: string;
}
