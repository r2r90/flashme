import { PrismaService } from './../../../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import type { IStripeUserRepository } from '../../domain/interfaces/stripe-user.repository.interface';

@Injectable()
export class StripeUserRepository implements IStripeUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveCustomerId(userId: string, customerId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  async findCustomerId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });
    return user?.stripeCustomerId ?? null;
  }
}
