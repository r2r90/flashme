import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { PresignedUrlResponse } from '@/shared/types';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';
import { StorageService } from './storage.service';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  getPresignedUrl(@Body() dto: GetUploadUrlDto): Promise<PresignedUrlResponse> {
    return this.storageService.getPresignedUploadUrl(dto.folder, dto.mimeType);
  }
}
