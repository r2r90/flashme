import { IsIn, IsString } from 'class-validator';

export class GetUploadUrlDto {
  @IsString()
  folder!: string;

  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  mimeType!: string;
}
