import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaBookingRepository } from '../../infrastructure/prisma-booking.repository';
import { UpdateBookingDto } from '../../dto/update-booking.dto';
import { canTransition } from '../../domain/booking-status-transition';

@Injectable()
export class UpdateBookingUseCase {
  constructor(private readonly bookingRepo: PrismaBookingRepository) {}

  async execute(id: string, dto: UpdateBookingDto) {
    const booking = await this.bookingRepo.findById(id);

    // Validate status transition if status is being updated
    if (dto.status && !canTransition(booking.status, dto.status)) {
      throw new BadRequestException(`Cannot transition from ${booking.status} to ${dto.status}`);
    }

    return this.bookingRepo.update(id, {
      ...(dto.status && { status: dto.status }),
      ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
    });
  }
}
