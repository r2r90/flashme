import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripeClientService } from '../../infrastructure/stripe-client.service';
import { TenantsService } from '@/modules/tenants/tenants.service';
import { StripeTenantRepository } from '../../infrastructure/repositories/stripe-tenant.repository';
import { StartOnboardingCommand } from '@/shared/types/stripe.types';

@Injectable()
export class StartOnboardingUseCase {
  private readonly logger = new Logger(StartOnboardingUseCase.name);

  constructor(
    private readonly stripeClient: StripeClientService,
    private readonly tenantsService: TenantsService,
    private readonly tenantRepo: StripeTenantRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(command: StartOnboardingCommand): Promise<string> {
    const tenant = await this.tenantsService.findById(command.tenantId);

    if (tenant.stripeOnboardingDone) {
      throw new BadRequestException('Studio has already completed onboarding');
    }

    let stripeAccountId = tenant.stripeAccountId;

    if (!stripeAccountId) {
      stripeAccountId = await this.createConnectAccount({
        tenantId: tenant.id,
        email: command.email,
        businessName: tenant.name,
      });

      await this.tenantRepo.saveAccountId(tenant.id, stripeAccountId);
    }

    return this.createOnboardingLink({
      stripeAccountId,
      tenantId: tenant.id,
    });
  }

  private async createConnectAccount(params: {
    tenantId: string;
    email: string;
    businessName: string;
  }): Promise<string> {
    const account = await this.stripeClient.client.accounts.create({
      type: 'express',
      email: params.email,
      business_profile: { name: params.businessName },
      metadata: { tenantId: params.tenantId },
    });

    this.logger.log(
      `Created Connect account ${account.id} for tenant ${params.tenantId}`,
    );

    return account.id;
  }

  private async createOnboardingLink(params: {
    stripeAccountId: string;
    tenantId: string;
  }): Promise<string> {
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');

    const accountLink = await this.stripeClient.client.accountLinks.create({
      account: params.stripeAccountId,
      return_url: `${frontendUrl}/onboarding/success?tenantId=${params.tenantId}`,
      refresh_url: `${frontendUrl}/onboarding/refresh?tenantId=${params.tenantId}`,
      type: 'account_onboarding',
    });

    return accountLink.url;
  }
}
