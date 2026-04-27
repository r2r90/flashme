import { PrismaService } from '@/shared/prisma/prisma.service';
import { CreateFlashCommand, FlashWithArtist } from '@/shared/types';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Flash, FlashStatus } from '@prisma/client';

@Injectable()
export class FlashesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFlashCommand): Promise<Flash> {
    if (data.price <= 0) {
      throw new BadRequestException('Flash price must be greater than zero');
    }

    const artist = await this.prisma.artist.findFirst({
      where: {
        id: data.artistId,
        tenantId: data.tenantId,
      },
      select: { id: true },
    });

    if (!artist) {
      throw new BadRequestException('Artist does not exist for this tenant');
    }

    return this.prisma.flash.create({ data });
  }

  async findAllByTenant(tenantId: string): Promise<FlashWithArtist[]> {
    return this.prisma.flash.findMany({
      where: {
        tenantId,
        status: FlashStatus.AVAILABLE,
      },
      include: {
        artist: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<FlashWithArtist> {
    const flash = await this.prisma.flash.findUnique({
      where: { id },
      include: {
        artist: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    if (!flash) {
      throw new NotFoundException('Flash not found');
    }

    return flash;
  }

  async updateStatus(id: string, status: FlashStatus): Promise<Flash> {
    const flash = await this.prisma.flash.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!flash) {
      throw new NotFoundException('Flash not found');
    }

    if (flash.status === FlashStatus.DONE && status !== FlashStatus.DONE) {
      throw new BadRequestException('Cannot update a completed flash');
    }

    return this.prisma.flash.update({
      where: { id },
      data: { status },
    });
  }
}
