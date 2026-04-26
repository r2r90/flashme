import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { StripeClientService } from '../../infrastructure/stripe-client.service';
import { StripeBookingRepository } from '../../infrastructure/repositories/stripe-booking.repository';
import { StripeUserRepository } from '../../infrastructure/repositories/stripe-user.repository';
import { BookingsService } from '../../../../bookings/bookings.service';

@Injectable()
export class CreatePaymentIntentUseCase {
  private readonly logger = new Logger(CreatePaymentIntentUseCase.name);

  constructor(
    private readonly stripeClient: StripeClientService,
    private readonly bookingsService: BookingsService,
    private readonly bookingRepo: StripeBookingRepository,
    private readonly userRepo: StripeUserRepository,
  ) {}

  async execute(params: {
    bookingId: string;
    userId: string;
    userEmail: string;
  }): Promise<{ clientSecret: string; depositAmount: number }> {
    const booking = await this.bookingsService.findOneWithDetails(
      params.bookingId,
    );

    // Guard clauses — fail fast
    if (booking.depositPaid)
      throw new BadRequestException('Deposit already paid');
    if (booking.stripePaymentIntentId)
      throw new BadRequestException('Payment already initiated');
    if (booking.clientId !== params.userId)
      throw new ForbiddenException('You can only pay for your own bookings');
    if (
      !booking.tenant.stripeAccountId ||
      !booking.tenant.stripeOnboardingDone
    ) {
      throw new BadRequestException(
        'Studio has not completed Stripe onboarding',
      );
    }

    const customerId = await this.getOrCreateCustomer({
      userId: params.userId,
      userEmail: params.userEmail,
      existingCustomerId: booking.client.stripeCustomerId,
    });

    const result = await this.createPaymentIntent({
      flashPriceInCents: booking.flash.price,
      stripeAccountId: booking.tenant.stripeAccountId,
      stripeCustomerId: customerId,
      bookingId: booking.id,
      tenantId: booking.tenantId,
    });

    await this.bookingRepo.savePaymentIntent(booking.id, {
      paymentIntentId: result.paymentIntentId,
      depositAmount: result.depositAmount,
    });

    return {
      clientSecret: result.clientSecret,
      depositAmount: result.depositAmount,
    };
  }

  private async getOrCreateCustomer(params: {
    userId: string;
    userEmail: string;
    existingCustomerId: string | null;
  }): Promise<string> {
    if (params.existingCustomerId) return params.existingCustomerId;

    const customer = await this.stripeClient.client.customers.create({
      email: params.userEmail,
      metadata: { userId: params.userId },
    });

    await this.userRepo.saveCustomerId(params.userId, customer.id);

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
      params.flashPriceInCents * StripeClientService.DEPOSIT_RATE,
    );

    const applicationFee = Math.round(
      depositAmount * this.stripeClient.commissionRate,
    );

    const paymentIntent = await this.stripeClient.client.paymentIntents.create({
      amount: depositAmount,
      currency: 'eur',
      capture_method: 'automatic',
      customer: params.stripeCustomerId,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      transfer_data: { destination: params.stripeAccountId },
      application_fee_amount: applicationFee,
      metadata: { bookingId: params.bookingId, tenantId: params.tenantId },
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
}
