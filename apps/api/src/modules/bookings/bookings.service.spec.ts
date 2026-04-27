import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { CreateBookingUseCase } from './application/use-cases/create-booking.use-case';
import { UpdateBookingUseCase } from './application/use-cases/update-booking.use-case';
import { CreateBookingDto } from './dto/create-booking.dto';

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
  booking: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

const mockCreateBookingUseCase = {
  execute: jest.fn(),
};

const mockUpdateBookingUseCase = {
  execute: jest.fn(),
};

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CreateBookingUseCase, useValue: mockCreateBookingUseCase },
        { provide: UpdateBookingUseCase, useValue: mockUpdateBookingUseCase },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to CreateBookingUseCase', async () => {
      mockCreateBookingUseCase.execute.mockResolvedValue(mockBooking);

      const dto: CreateBookingDto = {
        flashId: 'flash-id-123',
        scheduledAt: '2026-05-15T14:00:00.000Z',
      };

      const result = await service.create(dto, 'client-id-123');

      expect(result).toEqual(mockBooking);
      expect(mockCreateBookingUseCase.execute).toHaveBeenCalledWith({
        flashId: dto.flashId,
        clientId: 'client-id-123',
        scheduledAt: new Date(dto.scheduledAt),
      });
    });
  });

  describe('update', () => {
    it('should delegate to UpdateBookingUseCase', async () => {
      mockUpdateBookingUseCase.execute.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      const result = await service.update('booking-id-123', {
        status: BookingStatus.CONFIRMED,
      });

      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(mockUpdateBookingUseCase.execute).toHaveBeenCalledWith('booking-id-123', {
        status: BookingStatus.CONFIRMED,
      });
    });
  });
});
