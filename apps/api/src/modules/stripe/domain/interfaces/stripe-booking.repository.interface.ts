export interface IStripeBookingRepository {
  findByPaymentIntentId(paymentIntentId: string): Promise<{
    id: string;
    flashId: string;
    depositPaid: boolean;
  } | null>;

  savePaymentIntent(
    bookingId: string,
    params: {
      paymentIntentId: string;
      depositAmount: number;
    },
  ): Promise<void>;

  markDepositPaid(bookingId: string, flashId: string): Promise<void>;
}
