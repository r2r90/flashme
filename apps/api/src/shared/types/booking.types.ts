import { BookingStatus, Role } from '@prisma/client';

/**
 * Command for CreateBookingUseCase.
 */
export interface CreateBookingCommand {
  flashId: string;
  clientId: string;
  scheduledAt: Date;
}

/**
 * Command for UpdateBookingUseCase.
 */
export interface UpdateBookingCommand {
  bookingId: string;
  status: BookingStatus;
  userId: string;
  userRole: Role;
}

/**
 * Deposit calculation result from booking-policy.
 */
export interface DepositCalculation {
  depositAmount: number;
  flashPrice: number;
  depositRate: number;
}
