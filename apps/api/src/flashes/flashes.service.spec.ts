import { Test, TestingModule } from '@nestjs/testing';
import { FlashesService } from './flashes.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { FlashStatus } from '@prisma/client';

const mockFlash = {
  id: 'flash-id-123',
  tenantId: 'tenant-id-123',
  artistId: 'artist-id-123',
  title: 'Dragon japonais',
  description: 'Flash traditionnel',
  imageUrl: 'https://placehold.co/400x400',
  price: 35000,
  status: FlashStatus.AVAILABLE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaService = {
  flash: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('FlashesService', () => {
  let service: FlashesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlashesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<FlashesService>(FlashesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a flash', async () => {
      mockPrismaService.flash.create.mockResolvedValue(mockFlash);

      const result = await service.create({
        tenantId: 'tenant-id-123',
        artistId: 'artist-id-123',
        title: 'Dragon japonais',
        imageUrl: 'https://placehold.co/400x400',
        price: 35000,
      });

      expect(result.title).toBe('Dragon japonais');
      expect(result.status).toBe(FlashStatus.AVAILABLE);
    });
  });

  describe('findAllByTenant', () => {
    it('should return all available flashes for a tenant', async () => {
      mockPrismaService.flash.findMany.mockResolvedValue([mockFlash]);

      const result = await service.findAllByTenant('tenant-id-123');
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(FlashStatus.AVAILABLE);
    });
  });

  describe('findOne', () => {
    it('should return a flash by id', async () => {
      mockPrismaService.flash.findUnique.mockResolvedValue(mockFlash);

      const result = await service.findOne('flash-id-123');
      expect(result.id).toBe('flash-id-123');
    });

    it('should throw NotFoundException if flash not found', async () => {
      mockPrismaService.flash.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update flash status', async () => {
      mockPrismaService.flash.update.mockResolvedValue({
        ...mockFlash,
        status: FlashStatus.BOOKED,
      });

      const result = await service.updateStatus(
        'flash-id-123',
        FlashStatus.BOOKED,
      );
      expect(result.status).toBe(FlashStatus.BOOKED);
    });
  });
});
