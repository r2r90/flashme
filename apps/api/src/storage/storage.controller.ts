import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsIn } from 'class-validator';

class GetUploadUrlDto {
  @IsString()
  folder!: string;

  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  mimeType!: string;
}

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Post('presigned-url')
  getPresignedUrl(@Body() dto: GetUploadUrlDto) {
    return this.storageService.getPresignedUploadUrl(dto.folder, dto.mimeType);
  }
}
