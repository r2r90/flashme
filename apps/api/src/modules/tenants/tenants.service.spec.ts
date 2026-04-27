import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { ConflictException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';

const mockPrismaService = {
  tenant: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

describe('TenantsService', () => {
  let service: TenantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a tenant', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue({
        id: 'tenant-id',
        name: 'Test Studio',
        slug: 'test-studio',
      });

      const result = await service.create('Test Studio', 'test-studio');
      expect(result.slug).toBe('test-studio');
    });

    it('should throw ConflictException if slug exists', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.create('Test Studio', 'test-studio')).rejects.toThrow(ConflictException);
    });
  });

  describe('findBySlug', () => {
    it('should return tenant by slug', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: 'tenant-id',
        slug: 'test-studio',
      });

      const result = await service.findBySlug('test-studio');
      expect(result).toHaveProperty('slug', 'test-studio');
    });
  });
});
