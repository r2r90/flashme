import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeClientService } from './infrastructure/stripe-client.service';
import { StripeBookingRepository } from './infrastructure/repositories/stripe-booking.repository';
import { StripeTenantRepository } from './infrastructure/repositories/stripe-tenant.repository';
import { StripeUserRepository } from './infrastructure/repositories/stripe-user.repository';
import { StartOnboardingUseCase } from './application/use-cases/start-onboarding.use-case';
import { CreatePaymentIntentUseCase } from './application/use-cases/create-payment-intent.use-case';
import { HandleWebhookUseCase } from './application/use-cases/handle-webhook.use-case';
import { BookingsModule } from '@/modules/bookings/bookings.module';
import { TenantsModule } from '@/modules/tenants/tenants.module';

@Module({
  imports: [BookingsModule, TenantsModule],
  controllers: [StripeController],
  providers: [
    StripeClientService,
    StripeBookingRepository,
    StripeTenantRepository,
    StripeUserRepository,
    StartOnboardingUseCase,
    CreatePaymentIntentUseCase,
    HandleWebhookUseCase,
  ],
})
export class StripeModule {}
