import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { UpdateBookingUseCase } from './update-booking.use-case';
import { PrismaBookingRepository } from '../../infrastructure/prisma-booking.repository';

const mockBooking = {
  id: 'booking-id-123',
  tenantId: 'tenant-id-123',
  clientId: 'client-id-123',
  flashId: 'flash-id-123',
  scheduledAt: new Date('2026-05-15T14:00:00.000Z'),
  status: BookingStatus.PENDING,
  depositAmount: 10500,
  stripePaymentIntentId: null,
  depositPaid: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBookingRepo = {
  findById: jest.fn(),
  update: jest.fn(),
};

describe('UpdateBookingUseCase', () => {
  let useCase: UpdateBookingUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateBookingUseCase,
        { provide: PrismaBookingRepository, useValue: mockBookingRepo },
      ],
    }).compile();

    useCase = module.get<UpdateBookingUseCase>(UpdateBookingUseCase);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should update booking status', async () => {
      mockBookingRepo.findById.mockResolvedValue(mockBooking);
      mockBookingRepo.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      const result = await useCase.execute('booking-id-123', {
        status: BookingStatus.CONFIRMED,
      });

      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should throw BadRequestException on invalid transition', async () => {
      mockBookingRepo.findById.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.COMPLETED,
      });

      await expect(
        useCase.execute('booking-id-123', { status: BookingStatus.CONFIRMED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update booking scheduledAt', async () => {
      mockBookingRepo.findById.mockResolvedValue(mockBooking);
      mockBookingRepo.update.mockResolvedValue({
        ...mockBooking,
        scheduledAt: new Date('2026-06-15T14:00:00.000Z'),
      });

      const result = await useCase.execute('booking-id-123', {
        scheduledAt: '2026-06-15T14:00:00.000Z',
      });

      expect(result.scheduledAt).toEqual(new Date('2026-06-15T14:00:00.000Z'));
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockBookingRepo.findById.mockRejectedValue(new NotFoundException());

      await expect(
        useCase.execute('wrong-id', { status: BookingStatus.CONFIRMED }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
