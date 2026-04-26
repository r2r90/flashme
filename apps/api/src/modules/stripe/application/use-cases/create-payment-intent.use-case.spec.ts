import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CreatePaymentIntentUseCase } from './create-payment-intent.use-case';
import { StripeClientService } from '../../infrastructure/stripe-client.service';
import { StripeBookingRepository } from '../../infrastructure/repositories/stripe-booking.repository';
import { StripeUserRepository } from '../../infrastructure/repositories/stripe-user.repository';
import { BookingsService } from '../../../../bookings/bookings.service';

const stripePaymentIntentsCreateMock = jest.fn();
const stripeCustomersCreateMock = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: { create: stripePaymentIntentsCreateMock },
    customers: { create: stripeCustomersCreateMock },
  }));
});

describe('CreatePaymentIntentUseCase', () => {
  let useCase: CreatePaymentIntentUseCase;

  const configServiceMock = {
    getOrThrow: jest.fn((key: string): string => {
      const config: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_fake',
        STRIPE_COMMISSION_RATE: '0.10',
      };
      const value = config[key];
      if (!value) throw new Error(`Missing test config key: ${key}`);
      return value;
    }),
  };

  const bookingsServiceMock = { findOneWithDetails: jest.fn() };
  const bookingRepoMock = { savePaymentIntent: jest.fn() };
  const userRepoMock = { saveCustomerId: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePaymentIntentUseCase,
        {
          provide: StripeClientService,
          useValue: new StripeClientService(
            configServiceMock as unknown as ConfigService,
          ),
        },
        { provide: BookingsService, useValue: bookingsServiceMock },
        { provide: StripeBookingRepository, useValue: bookingRepoMock },
        { provide: StripeUserRepository, useValue: userRepoMock },
      ],
    }).compile();

    useCase = module.get<CreatePaymentIntentUseCase>(
      CreatePaymentIntentUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should reject payment when booking does not belong to current user', async () => {
      bookingsServiceMock.findOneWithDetails.mockResolvedValue({
        id: 'booking-1',
        clientId: 'other-client',
        tenantId: 'tenant-1',
        depositPaid: false,
        stripePaymentIntentId: null,
        tenant: {
          stripeAccountId: 'acct_test_123',
          stripeOnboardingDone: true,
        },
        client: { stripeCustomerId: null },
        flash: { price: 5000 },
      });

      await expect(
        useCase.execute({
          bookingId: 'booking-1',
          userId: 'client-1',
          userEmail: 'client@flashme.test',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(stripePaymentIntentsCreateMock).not.toHaveBeenCalled();
    });

    it('should reject payment when studio has not completed Stripe onboarding', async () => {
      bookingsServiceMock.findOneWithDetails.mockResolvedValue({
        id: 'booking-1',
        clientId: 'client-1',
        tenantId: 'tenant-1',
        depositPaid: false,
        stripePaymentIntentId: null,
        tenant: { stripeAccountId: null, stripeOnboardingDone: false },
        client: { stripeCustomerId: null },
        flash: { price: 5000 },
      });

      await expect(
        useCase.execute({
          bookingId: 'booking-1',
          userId: 'client-1',
          userEmail: 'client@flashme.test',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(stripePaymentIntentsCreateMock).not.toHaveBeenCalled();
    });

    it('should reject payment when deposit already paid', async () => {
      bookingsServiceMock.findOneWithDetails.mockResolvedValue({
        id: 'booking-1',
        clientId: 'client-1',
        tenantId: 'tenant-1',
        depositPaid: true,
        stripePaymentIntentId: null,
        tenant: {
          stripeAccountId: 'acct_test_123',
          stripeOnboardingDone: true,
        },
        client: { stripeCustomerId: null },
        flash: { price: 5000 },
      });

      await expect(
        useCase.execute({
          bookingId: 'booking-1',
          userId: 'client-1',
          userEmail: 'client@flashme.test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a PaymentIntent for a valid booking deposit', async () => {
      bookingsServiceMock.findOneWithDetails.mockResolvedValue({
        id: 'booking-1',
        clientId: 'client-1',
        tenantId: 'tenant-1',
        depositPaid: false,
        stripePaymentIntentId: null,
        tenant: {
          stripeAccountId: 'acct_test_123',
          stripeOnboardingDone: true,
        },
        client: { stripeCustomerId: 'cus_existing' },
        flash: { price: 5000 },
      });

      stripePaymentIntentsCreateMock.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_secret',
      });

      bookingRepoMock.savePaymentIntent.mockResolvedValue(undefined);

      await expect(
        useCase.execute({
          bookingId: 'booking-1',
          userId: 'client-1',
          userEmail: 'client@flashme.test',
        }),
      ).resolves.toEqual({
        clientSecret: 'pi_test_secret',
        depositAmount: 1500,
      });

      expect(stripePaymentIntentsCreateMock).toHaveBeenCalledWith({
        amount: 1500,
        currency: 'eur',
        capture_method: 'automatic',
        customer: 'cus_existing',
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        transfer_data: { destination: 'acct_test_123' },
        application_fee_amount: 150,
        metadata: { bookingId: 'booking-1', tenantId: 'tenant-1' },
      });

      expect(bookingRepoMock.savePaymentIntent).toHaveBeenCalledWith(
        'booking-1',
        { paymentIntentId: 'pi_test_123', depositAmount: 1500 },
      );
    });
  });
});
