import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BookingStatus, FlashStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { CreateBookingDto } from '../../dto/create-booking.dto';
import { calculateDeposit } from '../../domain/booking-policy';

@Injectable()
export class CreateBookingUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CreateBookingDto, clientId: string) {
    // Verify flash belongs to the tenant and is available
    const flash = await this.prisma.flash.findFirst({
      where: { id: dto.flashId, tenantId: dto.tenantId },
    });

    if (!flash) throw new NotFoundException('Flash not found in this studio');
    if (flash.status !== FlashStatus.AVAILABLE) {
      throw new BadRequestException('Flash is not available');
    }

    try {
      const [booking] = await this.prisma.$transaction([
        this.prisma.booking.create({
          data: {
            tenantId: dto.tenantId,
            clientId,
            flashId: dto.flashId,
            scheduledAt: new Date(dto.scheduledAt),
            depositAmount: calculateDeposit(flash.price),
            status: BookingStatus.PENDING,
          },
        }),
        this.prisma.flash.update({
          where: { id: dto.flashId },
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
