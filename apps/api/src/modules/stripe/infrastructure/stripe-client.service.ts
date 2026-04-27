import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeClientService {
  readonly client: InstanceType<typeof Stripe>;
  readonly commissionRate: number;
  static readonly DEPOSIT_RATE = 0.3;

  constructor(private readonly config: ConfigService) {
    this.client = new Stripe(this.config.getOrThrow<string>('STRIPE_SECRET_KEY'), {
      typescript: true,
    });

    this.commissionRate = parseFloat(this.config.getOrThrow<string>('STRIPE_COMMISSION_RATE'));
  }
}
