import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { FlashesModule } from './flashes/flashes.module';
import { BookingsModule } from './bookings/bookings.module';
import { StorageModule } from './storage/storage.module';
import { StripeModule } from './stripe/stripe.module';

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
