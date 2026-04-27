import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CreateBookingUseCase } from './application/use-cases/create-booking.use-case';
import { UpdateBookingUseCase } from './application/use-cases/update-booking.use-case';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly updateBookingUseCase: UpdateBookingUseCase,
  ) {}

  async create(dto: CreateBookingDto, clientId: string) {
    return this.createBookingUseCase.execute(dto, clientId);
  }

  async findAllByArtist(userId: string) {
    return this.prisma.booking.findMany({
      where: { flash: { artist: { userId } } },
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

  async findAllByTenant(tenantId: string | null) {
    if (!tenantId) throw new BadRequestException('User has no tenant');
    return this.prisma.booking.findMany({
      where: { tenantId },
      include: {
        flash: true,
        client: { select: { email: true, id: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async update(id: string, dto: UpdateBookingDto) {
    return this.updateBookingUseCase.execute(id, dto);
  }

  async findOneWithDetails(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { flash: true, tenant: true, client: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }
}
