import { PresignedUrlResponse } from '@/shared/types';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

// Single source of truth — all allowed MIME types defined once
const _ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type AllowedMimeType = (typeof _ALLOWED_MIME_TYPES)[number];

const _ALLOWED_FOLDERS = ['flashes', 'avatars', 'studios'] as const;
type _AllowedFolder = (typeof _ALLOWED_FOLDERS)[number];

const MIME_TO_EXTENSION: Record<AllowedMimeType, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// Presigned URL expiration in seconds (5 minutes)
const PRESIGNED_URL_EXPIRY = 300;

export function isAllowedMimeType(
  mimeType: string,
): mimeType is AllowedMimeType {
  return mimeType in MIME_TO_EXTENSION;
}

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {
    this.region = this.config.getOrThrow<string>('AWS_REGION');
    this.bucket = this.config.getOrThrow<string>('AWS_S3_BUCKET');

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  // Generate a presigned URL for direct client-side upload to S3
  async getPresignedUploadUrl(
    folder: string,
    mimeType: string,
  ): Promise<PresignedUrlResponse> {
    this.validateFolder(folder);

    if (!isAllowedMimeType(mimeType)) {
      throw new BadRequestException('Invalid mime type');
    }

    const extension = MIME_TO_EXTENSION[mimeType];
    const key = `${folder}/${randomUUID()}${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    try {
      const uploadUrl = await getSignedUrl(this.s3, command, {
        expiresIn: PRESIGNED_URL_EXPIRY,
      });

      return { uploadUrl, key };
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL for key=${key}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  // Delete a file from S3 by its key
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.s3.send(command);
    } catch (error) {
      this.logger.error(
        `Failed to delete file key=${key}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  // Build the public URL for a stored file
  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  // Validate folder against whitelist to prevent path traversal
  private validateFolder(folder: string): asserts folder is _AllowedFolder {
    if (!_ALLOWED_FOLDERS.includes(folder as _AllowedFolder)) {
      throw new BadRequestException(
        `Invalid folder "${folder}". Allowed: ${_ALLOWED_FOLDERS.join(', ')}`,
      );
    }
  }
}
