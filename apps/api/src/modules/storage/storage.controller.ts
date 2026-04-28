import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { PresignedUrlResponse } from '@/shared/types';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  @ApiOperation({ summary: 'Get a presigned S3 URL for direct file upload' })
  @ApiResponse({ status: 201, description: 'Returns upload URL and S3 key' })
  @ApiResponse({ status: 400, description: 'Invalid folder or mime type' })
  getPresignedUrl(@Body() dto: GetUploadUrlDto): Promise<PresignedUrlResponse> {
    return this.storageService.getPresignedUploadUrl(dto.folder, dto.mimeType);
  }
}
