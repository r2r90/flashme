import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingStatus, FlashStatus } from '@prisma/client';
import { CreateBookingUseCase } from './create-booking.use-case';
import { PrismaService } from '@/shared/prisma/prisma.service';

const mockFlash = {
  id: 'flash-id-123',
  tenantId: 'tenant-id-123',
  artistId: 'artist-id-123',
  title: 'Dragon japonais',
  price: 35000,
  status: FlashStatus.AVAILABLE,
};

const mockBooking = {
  id: 'booking-id-123',
  tenantId: 'tenant-id-123',
  clientId: 'client-id-123',
  flashId: 'flash-id-123',
  scheduledAt: new Date('2026-05-15T14:00:00.000Z'),
  status: BookingStatus.PENDING,
  depositAmount: 10500,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaService = {
  flash: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  booking: { create: jest.fn() },
  $transaction: jest.fn(),
};

describe('CreateBookingUseCase', () => {
  let useCase: CreateBookingUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBookingUseCase,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    useCase = module.get<CreateBookingUseCase>(CreateBookingUseCase);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create a booking and mark flash as booked', async () => {
      mockPrismaService.flash.findUnique.mockResolvedValue(mockFlash);
      mockPrismaService.$transaction.mockResolvedValue([mockBooking]);

      const result = await useCase.execute({
        flashId: 'flash-id-123',
        clientId: 'client-id-123',
        scheduledAt: new Date('2026-05-15T14:00:00.000Z'),
      });

      expect(result).toEqual(mockBooking);

      expect(mockPrismaService.flash.findUnique).toHaveBeenCalledWith({
        where: { id: 'flash-id-123' },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if flash not found', async () => {
      mockPrismaService.flash.findUnique.mockResolvedValue(null);

      await expect(
        useCase.execute({
          flashId: 'wrong-flash-id',
          clientId: 'client-id-123',
          scheduledAt: new Date('2026-05-15T14:00:00.000Z'),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if flash is not available', async () => {
      mockPrismaService.flash.findUnique.mockResolvedValue({
        ...mockFlash,
        status: FlashStatus.BOOKED,
      });

      await expect(
        useCase.execute({
          flashId: 'flash-id-123',
          clientId: 'client-id-123',
          scheduledAt: new Date('2026-05-15T14:00:00.000Z'),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
