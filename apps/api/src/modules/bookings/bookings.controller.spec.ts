import { Test, TestingModule } from '@nestjs/testing';
import { BookingStatus, Role } from '@prisma/client';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
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

const mockBookingsService = {
  create: jest.fn(),
  findAllByArtist: jest.fn(),
  findAllByClient: jest.fn(),
  findAllByTenant: jest.fn(),
  update: jest.fn(),
};

describe('BookingsController', () => {
  let controller: BookingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: mockBookingsService }],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto and client id', async () => {
      mockBookingsService.create.mockResolvedValue(mockBooking);

      const dto: CreateBookingDto = {
        flashId: 'flash-id-123',
        scheduledAt: '2026-05-15T14:00:00.000Z',
      };

      const mockAuthUser = {
        id: 'client-id-123',
        email: 'client@test.com',
        role: Role.CLIENT,
        tenantId: null,
      };

      const result = await controller.create(dto, mockAuthUser);

      expect(result).toEqual(mockBooking);
      expect(mockBookingsService.create).toHaveBeenCalledWith(
        dto,
        'client-id-123',
      );
    });
  });

  describe('findMyBookings', () => {
    it('should call service.findAllByClient with user id', async () => {
      mockBookingsService.findAllByClient.mockResolvedValue([mockBooking]);

      const mockAuthUser = {
        id: 'client-id-123',
        email: 'client@test.com',
        role: Role.CLIENT,
        tenantId: null,
      };

      const result = await controller.findMyBookings(mockAuthUser);

      expect(result).toEqual([mockBooking]);
      expect(mockBookingsService.findAllByClient).toHaveBeenCalledWith(
        'client-id-123',
      );
    });
  });

  describe('findMyArtistBookings', () => {
    it('should call service.findAllByArtist with user id', async () => {
      mockBookingsService.findAllByArtist.mockResolvedValue([mockBooking]);

      const mockAuthUser = {
        id: 'artist-user-id-123',
        email: 'artist@test.com',
        role: Role.ARTIST,
        tenantId: 'tenant-id-123',
      };

      const result = await controller.findMyArtistBookings(mockAuthUser);

      expect(result).toEqual([mockBooking]);
      expect(mockBookingsService.findAllByArtist).toHaveBeenCalledWith(
        'artist-user-id-123',
      );
    });
  });

  describe('findTenantBookings', () => {
    it('should call service.findAllByTenant with tenant id', async () => {
      mockBookingsService.findAllByTenant.mockResolvedValue([mockBooking]);

      const mockAuthUser = {
        id: 'owner-id-123',
        email: 'owner@test.com',
        role: Role.OWNER,
        tenantId: 'tenant-id-123',
      };

      const result = await controller.findTenantBookings(mockAuthUser);

      expect(result).toEqual([mockBooking]);
      expect(mockBookingsService.findAllByTenant).toHaveBeenCalledWith(
        'tenant-id-123',
      );
    });
  });

  describe('update', () => {
    it('should call service.update with booking id and dto', async () => {
      const updatedBooking = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      };
      mockBookingsService.update.mockResolvedValue(updatedBooking);

      const dto = { status: BookingStatus.CONFIRMED };
      const result = await controller.update('booking-id-123', dto);

      expect(result).toEqual(updatedBooking);
      expect(mockBookingsService.update).toHaveBeenCalledWith(
        'booking-id-123',
        dto,
      );
    });
  });
});
