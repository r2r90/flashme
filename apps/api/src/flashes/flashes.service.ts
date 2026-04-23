import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FlashStatus } from '@prisma/client';

@Injectable()
export class FlashesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    tenantId: string;
    artistId: string;
    title: string;
    description?: string;
    imageUrl: string;
    price: number;
  }) {
    return this.prisma.flash.create({ data });
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.flash.findMany({
      where: { tenantId, status: FlashStatus.AVAILABLE },
      include: { artist: { include: { user: { select: { email: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const flash = await this.prisma.flash.findUnique({
      where: { id },
      include: { artist: { include: { user: { select: { email: true } } } } },
    });
    if (!flash) throw new NotFoundException('Flash not found');
    return flash;
  }

  async updateStatus(id: string, status: FlashStatus) {
    return await this.prisma.flash.update({
      where: { id },
      data: { status },
    });
  }
}
