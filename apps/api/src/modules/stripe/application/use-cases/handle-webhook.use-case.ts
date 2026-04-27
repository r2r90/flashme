import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripeClientService } from '../../infrastructure/stripe-client.service';
import { StripeBookingRepository } from '../../infrastructure/repositories/stripe-booking.repository';
import { StripeTenantRepository } from '../../infrastructure/repositories/stripe-tenant.repository';
import Stripe from 'stripe';

type StripeClient = InstanceType<typeof Stripe>;
type PaymentIntent = Awaited<ReturnType<StripeClient['paymentIntents']['create']>>;
type Account = Awaited<ReturnType<StripeClient['accounts']['create']>>;

@Injectable()
export class HandleWebhookUseCase {
  private readonly logger = new Logger(HandleWebhookUseCase.name);

  constructor(
    private readonly stripeClient: StripeClientService,
    private readonly bookingRepo: StripeBookingRepository,
    private readonly tenantRepo: StripeTenantRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(rawBody: Buffer, signature: string): Promise<void> {
    const event = this.constructWebhookEvent(rawBody, signature);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.onPaymentIntentSucceeded(event.data.object as PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        this.onPaymentIntentFailed(event.data.object as PaymentIntent);
        break;

      case 'account.updated':
        await this.onAccountUpdated(event.data.object as Account);
        break;

      default:
        break;
    }
  }

  private constructWebhookEvent(payload: Buffer, signature: string) {
    const webhookSecret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');

    try {
      return this.stripeClient.client.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  private async onPaymentIntentSucceeded(paymentIntent: PaymentIntent): Promise<void> {
    const booking = await this.bookingRepo.findByPaymentIntentId(paymentIntent.id);

    if (!booking) {
      this.logger.warn(`No booking found for PaymentIntent ${paymentIntent.id}`);
      return;
    }

    if (booking.depositPaid) {
      this.logger.warn(`PaymentIntent ${paymentIntent.id} already processed`);
      return;
    }

    await this.bookingRepo.markDepositPaid(booking.id, booking.flashId);

    this.logger.log(`Payment succeeded for PaymentIntent ${paymentIntent.id}`);
  }

  private async onAccountUpdated(account: Account): Promise<void> {
    await this.tenantRepo.updateOnboardingStatus(account.id, {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      onboardingDone: account.charges_enabled && account.details_submitted,
    });

    this.logger.log(`Stripe account updated ${account.id}`);
  }

  private onPaymentIntentFailed(paymentIntent: PaymentIntent): void {
    this.logger.warn(`Payment failed for PaymentIntent ${paymentIntent.id}`);
  }
}
