import { Test, TestingModule } from '@nestjs/testing';
import { FlashesService } from './flashes.service';
import { NotFoundException } from '@nestjs/common';
import { FlashStatus } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';

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
  artist: {
    findFirst: jest.fn(),
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
      mockPrismaService.artist.findFirst.mockResolvedValue({
        id: 'artist-id-123',
      });

      mockPrismaService.flash.create.mockResolvedValue(mockFlash);

      const result = await service.create({
        tenantId: 'tenant-id-123',
        artistId: 'artist-id-123',
        title: 'Dragon japonais',
        imageUrl: 'https://placehold.co/400x400',
        price: 35000,
      });

      expect(mockPrismaService.artist.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'artist-id-123',
          tenantId: 'tenant-id-123',
        },
        select: { id: true },
      });

      expect(mockPrismaService.flash.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-id-123',
          artistId: 'artist-id-123',
          title: 'Dragon japonais',
          imageUrl: 'https://placehold.co/400x400',
          price: 35000,
        },
      });

      expect(result.title).toBe('Dragon japonais');
      expect(result.status).toBe(FlashStatus.AVAILABLE);
    });

    it('should throw BadRequestException when artist does not exist for tenant', async () => {
      mockPrismaService.artist.findFirst.mockResolvedValue(null);

      await expect(
        service.create({
          tenantId: 'tenant-id-123',
          artistId: 'artist-id-123',
          title: 'Dragon japonais',
          imageUrl: 'https://placehold.co/400x400',
          price: 35000,
        }),
      ).rejects.toThrow('Artist does not exist for this tenant');

      expect(mockPrismaService.flash.create).not.toHaveBeenCalled();
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
    it('should throw NotFoundException when updating a non-existent flash', async () => {
      mockPrismaService.flash.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('missing-id', FlashStatus.BOOKED),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.flash.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to update completed flash', async () => {
      mockPrismaService.flash.findUnique.mockResolvedValue({
        id: 'flash-id-123',
        status: FlashStatus.DONE,
      });

      await expect(
        service.updateStatus('flash-id-123', FlashStatus.BOOKED),
      ).rejects.toThrow('Cannot update a completed flash');

      expect(mockPrismaService.flash.update).not.toHaveBeenCalled();
    });

    it('should update flash status', async () => {
      mockPrismaService.flash.findUnique.mockResolvedValue({
        id: 'flash-id-123',
        status: FlashStatus.AVAILABLE,
      });

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
