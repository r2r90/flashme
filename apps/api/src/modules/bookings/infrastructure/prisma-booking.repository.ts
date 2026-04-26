import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, FlashStatus } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class PrismaBookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async findByFlashId(flashId: string) {
    return this.prisma.booking.findFirst({ where: { flashId } });
  }

  async findWithDetails(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { flash: true, tenant: true, client: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
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

  async createWithFlashLock(data: {
    tenantId: string;
    clientId: string;
    flashId: string;
    scheduledAt: Date;
    depositAmount: number;
    status: BookingStatus;
  }) {
    const [booking] = await this.prisma.$transaction([
      this.prisma.booking.create({ data }),
      this.prisma.flash.update({
        where: { id: data.flashId },
        data: { status: FlashStatus.BOOKED },
      }),
    ]);
    return booking;
  }

  async update(
    id: string,
    data: {
      status?: BookingStatus;
      scheduledAt?: Date;
    },
  ) {
    return this.prisma.booking.update({ where: { id }, data });
  }
}
