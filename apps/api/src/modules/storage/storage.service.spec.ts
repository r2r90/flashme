import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock AWS SDK modules before any imports use them
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

// Type the mocked function for strict usage — no `any` needed
const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

mockGetSignedUrl.mockResolvedValue('https://mock-presigned-url.s3.amazonaws.com' as string);
const mockSend = jest.fn();

// Mock S3Client constructor to return our controlled mock
(S3Client as jest.Mock).mockImplementation(() => ({
  send: mockSend,
}));

const TEST_CONFIG: Record<string, string> = {
  AWS_REGION: 'eu-west-3',
  AWS_ACCESS_KEY_ID: 'test-access-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  AWS_S3_BUCKET: 'test-bucket',
};

const mockConfigService = {
  getOrThrow: jest.fn((key: string): string => {
    const value = TEST_CONFIG[key];
    if (!value) throw new Error(`Missing config key: ${key}`);
    return value;
  }),
};

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset default mock behavior before each test
    mockGetSignedUrl.mockResolvedValue('https://mock-presigned-url.s3.amazonaws.com');
    mockSend.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // getPresignedUploadUrl
  // ──────────────────────────────────────────────
  describe('getPresignedUploadUrl', () => {
    it('should return an uploadUrl and a key with correct format', async () => {
      const result = await service.getPresignedUploadUrl('flashes', 'image/jpeg');

      expect(result.uploadUrl).toBe('https://mock-presigned-url.s3.amazonaws.com');
      // Key format: folder/uuid.extension
      expect(result.key).toMatch(/^flashes\/[0-9a-f-]{36}\.jpg$/);
    });

    it('should generate .png extension for image/png', async () => {
      const result = await service.getPresignedUploadUrl('flashes', 'image/png');
      expect(result.key).toMatch(/\.png$/);
    });

    it('should generate .webp extension for image/webp', async () => {
      const result = await service.getPresignedUploadUrl('avatars', 'image/webp');
      expect(result.key).toMatch(/^avatars\/.*\.webp$/);
    });

    it('should accept "studios" as a valid folder', async () => {
      const result: { uploadUrl: string; key: string } = await service.getPresignedUploadUrl(
        'studios',
        'image/jpeg',
      );
      expect(result.key).toMatch(/^studios\//);
    });

    it('should call getSignedUrl with PutObjectCommand and 300s expiry', async () => {
      await service.getPresignedUploadUrl('flashes', 'image/jpeg');

      expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);

      // Verify PutObjectCommand was constructed with correct params
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: expect.stringMatching(/^flashes\/[0-9a-f-]{36}\.jpg$/) as string,
        ContentType: 'image/jpeg',
      });

      // Verify expiry is set to 300 seconds
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(), // S3Client instance
        expect.any(PutObjectCommand),
        { expiresIn: 300 },
      );
    });

    it('should generate unique keys for consecutive calls', async () => {
      const result1: { uploadUrl: string; key: string } = await service.getPresignedUploadUrl(
        'flashes',
        'image/jpeg',
      );
      const result2: { uploadUrl: string; key: string } = await service.getPresignedUploadUrl(
        'flashes',
        'image/jpeg',
      );

      expect(result1.key).not.toBe(result2.key);
    });

    // ── Validation errors ──

    it('should throw BadRequestException for invalid folder', async () => {
      await expect(service.getPresignedUploadUrl('../../etc', 'image/jpeg')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for empty folder', async () => {
      await expect(service.getPresignedUploadUrl('', 'image/jpeg')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for unknown folder', async () => {
      await expect(service.getPresignedUploadUrl('documents', 'image/jpeg')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for unsupported MIME type', async () => {
      await expect(service.getPresignedUploadUrl('flashes', 'image/gif')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for non-image MIME type', async () => {
      await expect(service.getPresignedUploadUrl('flashes', 'application/pdf')).rejects.toThrow(
        BadRequestException,
      );
    });

    // ── S3 errors ──

    it('should throw InternalServerErrorException when getSignedUrl fails', async () => {
      mockGetSignedUrl.mockRejectedValueOnce(new Error('S3 unavailable'));

      await expect(service.getPresignedUploadUrl('flashes', 'image/jpeg')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ──────────────────────────────────────────────
  // deleteFile
  // ──────────────────────────────────────────────
  describe('deleteFile', () => {
    it('should send DeleteObjectCommand with correct bucket and key', async () => {
      await service.deleteFile('flashes/test-uuid.jpg');

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'flashes/test-uuid.jpg',
      });
    });

    it('should not throw when deletion succeeds', async () => {
      const result: void = await service.deleteFile('flashes/test.jpg');
      expect(result).toBeUndefined();
    });

    it('should throw InternalServerErrorException when S3 send fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.deleteFile('flashes/test.jpg')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ──────────────────────────────────────────────
  // getPublicUrl
  // ──────────────────────────────────────────────
  describe('getPublicUrl', () => {
    it('should build correct S3 public URL', () => {
      const url = service.getPublicUrl('flashes/abc-123.jpg');
      expect(url).toBe('https://test-bucket.s3.eu-west-3.amazonaws.com/flashes/abc-123.jpg');
    });

    it('should handle keys with nested paths', () => {
      const url = service.getPublicUrl('studios/sub/image.png');
      expect(url).toBe('https://test-bucket.s3.eu-west-3.amazonaws.com/studios/sub/image.png');
    });
  });

  // ──────────────────────────────────────────────
  // Constructor / Config
  // ──────────────────────────────────────────────
  describe('constructor', () => {
    it('should read all required config keys on init', () => {
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('AWS_REGION');
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('AWS_S3_BUCKET');
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('AWS_ACCESS_KEY_ID');
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('AWS_SECRET_ACCESS_KEY');
    });

    it('should initialize S3Client with correct region and credentials', () => {
      expect(S3Client).toHaveBeenCalledWith({
        region: 'eu-west-3',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
      });
    });
  });
});
