import { Injectable } from '@nestjs/common';
import type { IStripeTenantRepository } from '../../domain/interfaces/stripe-tenant.repository.interface';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class StripeTenantRepository implements IStripeTenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveAccountId(
    tenantId: string,
    stripeAccountId: string,
  ): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeAccountId },
    });
  }

  async updateOnboardingStatus(
    stripeAccountId: string,
    params: {
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      detailsSubmitted: boolean;
      onboardingDone: boolean;
    },
  ): Promise<void> {
    await this.prisma.tenant.update({
      where: { stripeAccountId },
      data: {
        stripeChargesEnabled: params.chargesEnabled,
        stripePayoutsEnabled: params.payoutsEnabled,
        stripeDetailsSubmitted: params.detailsSubmitted,
        stripeOnboardingDone: params.onboardingDone,
      },
    });
  }
}
