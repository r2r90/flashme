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
  userEmail: string;
}

/**
 * Response from CreatePaymentIntentUseCase.
 */
export interface PaymentIntentResponse {
  clientSecret: string;
  depositAmount: number;
}

/**
 * Response from onboarding endpoint.
 */
export interface OnboardingResponse {
  onboardingUrl: string;
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

/**
 * Webhook acknowledgement response.
 */
export interface WebhookResponse {
  received: boolean;
}
