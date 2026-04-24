import { Test, TestingModule } from '@nestjs/testing';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

const mockStorageService = {
  getPresignedUploadUrl: jest.fn(),
};

describe('StorageController', () => {
  let controller: StorageController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [{ provide: StorageService, useValue: mockStorageService }],
    }).compile();

    controller = module.get<StorageController>(StorageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPresignedUrl', () => {
    it('should call storageService.getPresignedUploadUrl with folder and mimeType', async () => {
      const mockResult = {
        uploadUrl: 'https://mock-presigned-url.com',
        key: 'flashes/test-uuid.jpg',
      };
      mockStorageService.getPresignedUploadUrl.mockResolvedValue(mockResult);

      const dto = { folder: 'flashes', mimeType: 'image/jpeg' };
      const result = await controller.getPresignedUrl(dto);

      expect(mockStorageService.getPresignedUploadUrl).toHaveBeenCalledWith(
        'flashes',
        'image/jpeg',
      );
      expect(result).toEqual(mockResult);
    });
  });
});
