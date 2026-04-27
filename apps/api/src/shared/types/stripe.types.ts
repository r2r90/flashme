/**
 * Command for StartOnboardingUseCase.
 */
export interface StartOnboardingCommand {
  tenantId: string;
  email: string;
}

/**
 * Command for CreatePaymentIntentUseCase.
 */
export interface CreatePaymentIntentCommand {
  bookingId: string;
  userId: string;
}

/**
 * Stripe onboarding status — synced from webhooks.
 */
export interface OnboardingStatus {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  onboardingDone: boolean;
}
