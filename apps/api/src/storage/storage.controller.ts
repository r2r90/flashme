import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  getPresignedUrl(@Body() dto: GetUploadUrlDto) {
    return this.storageService.getPresignedUploadUrl(dto.folder, dto.mimeType);
  }
}
