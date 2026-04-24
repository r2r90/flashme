import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingStatus, FlashStatus } from '@prisma/client';

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
  booking: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a booking and mark flash as booked', async () => {
      mockPrismaService.flash.findUnique.mockResolvedValue(mockFlash);
      mockPrismaService.$transaction.mockResolvedValue([mockBooking]);

      const result = await service.create(
        {
          flashId: 'flash-id-123',
          clientId: 'client-id-123',
          scheduledAt: '2026-05-15T14:00:00.000Z',
        },
        'tenant-id-123',
      );

      expect(result).toEqual(mockBooking);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if flash not found', async () => {
      mockPrismaService.flash.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            flashId: 'wrong-id',
            clientId: 'client-id',
            scheduledAt: '2026-05-15T14:00:00.000Z',
          },
          'tenant-id-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if flash is not available', async () => {
      mockPrismaService.flash.findUnique.mockResolvedValue({
        ...mockFlash,
        status: FlashStatus.BOOKED,
      });

      await expect(
        service.create(
          {
            flashId: 'flash-id-123',
            clientId: 'client-id',
            scheduledAt: '2026-05-15T14:00:00.000Z',
          },
          'tenant-id-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update booking status and date', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      const result = await service.update('booking-id-123', {
        status: BookingStatus.CONFIRMED,
      });

      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.update('wrong-id', { status: BookingStatus.CONFIRMED }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
