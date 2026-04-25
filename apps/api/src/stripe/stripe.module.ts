import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { BookingsModule } from 'src/bookings/bookings.module';
import { TenantsModule } from 'src/tenants/tenants.module';

@Module({
  imports: [BookingsModule, TenantsModule],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
