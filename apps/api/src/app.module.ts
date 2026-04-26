import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { StripeModule } from '@/modules/stripe/stripe.module';
import { PrismaModule } from '@/shared/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { FlashesModule } from './modules/flashes/flashes.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    FlashesModule,
    BookingsModule,
    StorageModule,
    StripeModule,
  ],
})
export class AppModule {}
