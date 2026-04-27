import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { CreateBookingUseCase } from './application/use-cases/create-booking.use-case';
import { UpdateBookingUseCase } from './application/use-cases/update-booking.use-case';
import { PrismaBookingRepository } from './infrastructure/prisma-booking.repository';

@Module({
  providers: [BookingsService, CreateBookingUseCase, UpdateBookingUseCase, PrismaBookingRepository],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}
