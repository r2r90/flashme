export interface IStripeTenantRepository {
  saveAccountId(tenantId: string, stripeAccountId: string): Promise<void>;

  updateOnboardingStatus(
    stripeAccountId: string,
    params: {
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      detailsSubmitted: boolean;
      onboardingDone: boolean;
    },
  ): Promise<void>;
}
