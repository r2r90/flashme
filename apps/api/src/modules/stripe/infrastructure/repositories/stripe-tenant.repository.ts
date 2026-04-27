import { Injectable, Logger } from '@nestjs/common';
import type { IStripeTenantRepository } from '../../domain/interfaces/stripe-tenant.repository.interface';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class StripeTenantRepository implements IStripeTenantRepository {
  private readonly logger = new Logger(StripeTenantRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async saveAccountId(tenantId: string, stripeAccountId: string): Promise<void> {
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
    // updateMany never throws P2025 — it simply updates 0 rows if not found
    const result = await this.prisma.tenant.updateMany({
      where: { stripeAccountId },
      data: {
        stripeChargesEnabled: params.chargesEnabled,
        stripePayoutsEnabled: params.payoutsEnabled,
        stripeDetailsSubmitted: params.detailsSubmitted,
        stripeOnboardingDone: params.onboardingDone,
      },
    });

    // If 0 rows updated, the event arrived before saveAccountId() was called
    // or it's a platform-level event — both are expected, not errors
    if (result.count === 0) {
      this.logger.warn(
        `updateOnboardingStatus: no tenant found for stripeAccountId=${stripeAccountId} — skipping`,
      );
    }
  }
}
