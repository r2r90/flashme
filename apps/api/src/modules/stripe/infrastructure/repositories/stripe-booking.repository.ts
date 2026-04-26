import { Injectable } from '@nestjs/common';
import { BookingStatus, FlashStatus } from '@prisma/client';

import { IStripeBookingRepository } from '../../domain/interfaces/stripe-booking.repository.interface';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class StripeBookingRepository implements IStripeBookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPaymentIntentId(paymentIntentId: string) {
    return this.prisma.booking.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      select: { id: true, flashId: true, depositPaid: true },
    });
  }

  async savePaymentIntent(
    bookingId: string,
    params: { paymentIntentId: string; depositAmount: number },
  ): Promise<void> {
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        stripePaymentIntentId: params.paymentIntentId,
        depositAmount: params.depositAmount,
      },
    });
  }

  async markDepositPaid(bookingId: string, flashId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { depositPaid: true, status: BookingStatus.CONFIRMED },
      }),
      this.prisma.flash.update({
        where: { id: flashId },
        data: { status: FlashStatus.BOOKED },
      }),
    ]);
  }
}
