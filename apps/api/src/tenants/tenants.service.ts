import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, slug: string) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Slug already taken');

    return this.prisma.tenant.create({
      data: { name, slug },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }
}
