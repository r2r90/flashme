import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { TenantsService } from '../tenants/tenants.service';
import { BookingStatus, FlashStatus } from '@prisma/client';
import Stripe from 'stripe';

type StripeClient = InstanceType<typeof Stripe>;
type PaymentIntent = Awaited<
  ReturnType<StripeClient['paymentIntents']['create']>
>;
type Account = Awaited<ReturnType<StripeClient['accounts']['create']>>;
type StripeEvent = ReturnType<StripeClient['webhooks']['constructEvent']>;

@Injectable()
export class StripeService {
  private readonly stripe: StripeClient;
  private readonly logger = new Logger(StripeService.name);
  private readonly commissionRate: number;
  private static readonly DEPOSIT_RATE = 0.3;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
    private readonly tenantsService: TenantsService,
  ) {
    const secretKey =
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY');

    this.commissionRate = parseFloat(
      this.configService.getOrThrow<string>('STRIPE_COMMISSION_RATE'),
    );

    this.stripe = new Stripe(secretKey, {
      typescript: true,
    });
  }

  async startOnboarding(params: {
    tenantId: string;
    email: string;
  }): Promise<string> {
    const tenant = await this.tenantsService.findById(params.tenantId);

    let stripeAccountId = tenant.stripeAccountId;

    if (tenant.stripeOnboardingDone) {
      throw new BadRequestException('Studio has already completed onboarding');
    }

    if (!stripeAccountId) {
      stripeAccountId = await this.createConnectAccount({
        tenantId: tenant.id,
        email: params.email,
        businessName: tenant.name,
      });

      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeAccountId },
      });
    }

    return this.createOnboardingLink({
      stripeAccountId,
      tenantId: tenant.id,
    });
  }

  async createBookingPaymentIntent(params: {
    bookingId: string;
    userId: string;
    userEmail: string;
  }): Promise<{ clientSecret: string; depositAmount: number }> {
    const booking = await this.bookingsService.findOneWithDetails(
      params.bookingId,
    );

    if (booking.depositPaid) {
      throw new BadRequestException('Deposit already paid');
    }

    if (booking.stripePaymentIntentId) {
      throw new BadRequestException('Payment already initiated');
    }

    if (booking.clientId !== params.userId) {
      throw new ForbiddenException('You can only pay for your own bookings');
    }

    if (
      !booking.tenant.stripeAccountId ||
      !booking.tenant.stripeOnboardingDone
    ) {
      throw new BadRequestException(
        'Studio has not completed Stripe onboarding',
      );
    }

    const stripeCustomerId = await this.getOrCreateCustomer({
      userId: params.userId,
      userEmail: params.userEmail,
      existingCustomerId: booking.client.stripeCustomerId,
    });

    const result = await this.createPaymentIntent({
      flashPriceInCents: booking.flash.price,
      stripeAccountId: booking.tenant.stripeAccountId,
      stripeCustomerId,
      bookingId: booking.id,
      tenantId: booking.tenantId,
    });

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        stripePaymentIntentId: result.paymentIntentId,
        depositAmount: result.depositAmount,
      },
    });

    return {
      clientSecret: result.clientSecret,
      depositAmount: result.depositAmount,
    };
  }

  async handleWebhookEvent(rawBody: Buffer, signature: string): Promise<void> {
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

  private async createConnectAccount(params: {
    tenantId: string;
    email: string;
    businessName: string;
  }): Promise<string> {
    const account = await this.stripe.accounts.create({
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
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    const accountLink = await this.stripe.accountLinks.create({
      account: params.stripeAccountId,
      return_url: `${frontendUrl}/onboarding/success?tenantId=${params.tenantId}`,
      refresh_url: `${frontendUrl}/onboarding/refresh?tenantId=${params.tenantId}`,
      type: 'account_onboarding',
    });

    return accountLink.url;
  }

  private async getOrCreateCustomer(params: {
    userId: string;
    userEmail: string;
    existingCustomerId: string | null;
  }): Promise<string> {
    if (params.existingCustomerId) {
      return params.existingCustomerId;
    }

    const customer = await this.stripe.customers.create({
      email: params.userEmail,
      metadata: { userId: params.userId },
    });

    await this.prisma.user.update({
      where: { id: params.userId },
      data: { stripeCustomerId: customer.id },
    });

    this.logger.log(
      `Created Stripe Customer ${customer.id} for user ${params.userId}`,
    );

    return customer.id;
  }

  private async createPaymentIntent(params: {
    flashPriceInCents: number;
    stripeAccountId: string;
    stripeCustomerId: string;
    bookingId: string;
    tenantId: string;
  }): Promise<{
    clientSecret: string;
    paymentIntentId: string;
    depositAmount: number;
  }> {
    const depositAmount = Math.round(
      params.flashPriceInCents * StripeService.DEPOSIT_RATE,
    );

    const applicationFee = Math.round(depositAmount * this.commissionRate);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: depositAmount,
      currency: 'eur',
      capture_method: 'automatic',
      customer: params.stripeCustomerId,
      transfer_data: {
        destination: params.stripeAccountId,
      },
      application_fee_amount: applicationFee,
      metadata: {
        bookingId: params.bookingId,
        tenantId: params.tenantId,
      },
    });

    if (!paymentIntent.client_secret) {
      throw new BadRequestException(
        'Failed to create PaymentIntent: missing client secret',
      );
    }

    this.logger.log(
      `PaymentIntent ${paymentIntent.id} — deposit: ${depositAmount}cts, fee: ${applicationFee}cts`,
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      depositAmount,
    };
  }

  private async onPaymentIntentSucceeded(
    paymentIntent: PaymentIntent,
  ): Promise<void> {
    const booking = await this.prisma.booking.findFirst({
      where: {
        stripePaymentIntentId: paymentIntent.id,
      },
      select: {
        id: true,
        flashId: true,
        depositPaid: true,
      },
    });

    if (!booking) {
      this.logger.warn(
        `No booking found for PaymentIntent ${paymentIntent.id}`,
      );
      return;
    }

    if (booking.depositPaid) {
      this.logger.warn(`PaymentIntent ${paymentIntent.id} already processed`);
      return;
    }

    await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          depositPaid: true,
          status: BookingStatus.CONFIRMED,
        },
      }),
      this.prisma.flash.update({
        where: { id: booking.flashId },
        data: {
          status: FlashStatus.BOOKED,
        },
      }),
    ]);

    this.logger.log(`Payment succeeded for PaymentIntent ${paymentIntent.id}`);
  }

  private async onAccountUpdated(account: Account): Promise<void> {
    await this.prisma.tenant.update({
      where: {
        stripeAccountId: account.id,
      },
      data: {
        stripeChargesEnabled: account.charges_enabled,
        stripePayoutsEnabled: account.payouts_enabled,
        stripeDetailsSubmitted: account.details_submitted,
        stripeOnboardingDone:
          account.charges_enabled && account.details_submitted,
      },
    });

    this.logger.log(`Stripe account updated ${account.id}`);
  }

  private constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): StripeEvent {
    const webhookSecret = this.configService.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );

      throw new BadRequestException('Invalid webhook signature');
    }
  }

  private onPaymentIntentFailed(paymentIntent: PaymentIntent): void {
    this.logger.warn(`Payment failed for PaymentIntent ${paymentIntent.id}`);
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<void> {
    await this.stripe.paymentIntents.cancel(paymentIntentId);
    this.logger.log(`Cancelled PaymentIntent ${paymentIntentId}`);
  }
}
