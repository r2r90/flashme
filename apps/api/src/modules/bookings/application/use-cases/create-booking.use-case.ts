import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Booking, BookingStatus, FlashStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { calculateDeposit } from '../../domain/booking-policy';
import { CreateBookingCommand } from '@/shared/types';

@Injectable()
export class CreateBookingUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateBookingCommand): Promise<Booking> {
    const flash = await this.prisma.flash.findUnique({
      where: { id: command.flashId },
    });

    if (!flash) {
      throw new NotFoundException('Flash not found');
    }

    if (flash.status !== FlashStatus.AVAILABLE) {
      throw new BadRequestException('Flash is not available');
    }

    try {
      const [booking] = await this.prisma.$transaction([
        this.prisma.booking.create({
          data: {
            tenantId: flash.tenantId,
            clientId: command.clientId,
            flashId: command.flashId,
            scheduledAt: new Date(command.scheduledAt),
            depositAmount: calculateDeposit(flash.price),
            status: BookingStatus.PENDING,
          },
        }),
        this.prisma.flash.update({
          where: { id: command.flashId },
          data: { status: FlashStatus.BOOKED },
        }),
      ]);

      return booking;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Flash is already booked');
      }
      throw error;
    }
  }
}
