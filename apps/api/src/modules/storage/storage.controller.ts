import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  getPresignedUrl(@Body() dto: GetUploadUrlDto) {
    return this.storageService.getPresignedUploadUrl(dto.folder, dto.mimeType);
  }
}
