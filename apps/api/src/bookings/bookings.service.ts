import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, FlashStatus } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBookingDto, tenantId: string) {
    const flash = await this.prisma.flash.findUnique({
      where: { id: dto.flashId },
    });

    if (!flash) throw new NotFoundException('Flash not found');
    if (flash.status !== FlashStatus.AVAILABLE) {
      throw new BadRequestException('Flash is not available');
    }

    try {
      const [booking] = await this.prisma.$transaction([
        this.prisma.booking.create({
          data: {
            tenantId,
            clientId: dto.clientId,
            flashId: dto.flashId,
            scheduledAt: new Date(dto.scheduledAt),
            depositAmount: Math.round(flash.price * 0.3),
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

  async findAllByArtist(artistId: string) {
    return this.prisma.booking.findMany({
      where: { flash: { artistId } },
      include: {
        flash: true,
        client: { select: { email: true, id: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findAllByClient(clientId: string) {
    return this.prisma.booking.findMany({
      where: { clientId },
      include: { flash: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async update(id: string, dto: UpdateBookingDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');

    return this.prisma.booking.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
      },
    });
  }
}
