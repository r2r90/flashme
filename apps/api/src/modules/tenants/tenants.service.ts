import { PrismaService } from '@/shared/prisma/prisma.service';
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Tenant } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, slug: string): Promise<Tenant> {
    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Slug already taken');

    return this.prisma.tenant.create({
      data: { name, slug },
    });
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }
}
