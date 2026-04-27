import { IsString, IsUUID, IsUrl, IsInt, IsOptional, Min } from 'class-validator';

export class CreateFlashDto {
  @IsUUID()
  tenantId!: string;

  @IsUUID()
  artistId!: string;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  imageUrl!: string;

  @IsInt()
  @Min(1)
  price!: number;
}
