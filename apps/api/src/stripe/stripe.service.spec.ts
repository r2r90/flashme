import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { TenantsService } from '../tenants/tenants.service';
import { StripeService } from './stripe.service';

const stripeAccountsCreateMock = jest.fn();
const stripeAccountLinksCreateMock = jest.fn();
const stripeCustomersCreateMock = jest.fn();
const stripePaymentIntentsCreateMock = jest.fn();
const stripeWebhooksConstructEventMock = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    accounts: {
      create: stripeAccountsCreateMock,
    },
    accountLinks: {
      create: stripeAccountLinksCreateMock,
    },
    customers: {
      create: stripeCustomersCreateMock,
    },
    paymentIntents: {
      create: stripePaymentIntentsCreateMock,
    },
    webhooks: {
      constructEvent: stripeWebhooksConstructEventMock,
    },
  }));
});

describe('StripeService', () => {
  let service: StripeService;

  const configServiceMock = {
    getOrThrow: jest.fn((key: string): string => {
      const config: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_fake',
        STRIPE_COMMISSION_RATE: '0.10',
        FRONTEND_URL: 'http://localhost:3000',
        STRIPE_WEBHOOK_SECRET: 'whsec_fake',
      };

      const value = config[key];

      if (!value) {
        throw new Error(`Missing test config key: ${key}`);
      }

      return value;
    }),
  };

  const prismaServiceMock = {
    tenant: {
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    booking: {
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const bookingsServiceMock = {
    findOneWithDetails: jest.fn(),
  };

  const tenantsServiceMock = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
        {
          provide: BookingsService,
          useValue: bookingsServiceMock,
        },
        {
          provide: TenantsService,
          useValue: tenantsServiceMock,
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startOnboarding', () => {
    it('should reject onboarding when the tenant already completed it', async () => {
      tenantsServiceMock.findById.mockResolvedValue({
        id: 'tenant-1',
        name: 'FlashMe Studio',
        stripeAccountId: 'acct_existing',
        stripeOnboardingDone: true,
      });

      await expect(
        service.startOnboarding({
          tenantId: 'tenant-1',
          email: 'owner@flashme.test',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(stripeAccountsCreateMock).not.toHaveBeenCalled();
      expect(stripeAccountLinksCreateMock).not.toHaveBeenCalled();
    });

    it('should create a Connect account and return an onboarding link', async () => {
      tenantsServiceMock.findById.mockResolvedValue({
        id: 'tenant-1',
        name: 'FlashMe Studio',
        stripeAccountId: null,
        stripeOnboardingDone: false,
      });

      stripeAccountsCreateMock.mockResolvedValue({
        id: 'acct_test_123',
      });

      stripeAccountLinksCreateMock.mockResolvedValue({
        url: 'https://connect.stripe.com/onboarding/test',
      });

      prismaServiceMock.tenant.update.mockResolvedValue({
        id: 'tenant-1',
        stripeAccountId: 'acct_test_123',
      });

      await expect(
        service.startOnboarding({
          tenantId: 'tenant-1',
          email: 'owner@flashme.test',
        }),
      ).resolves.toBe('https://connect.stripe.com/onboarding/test');

      expect(stripeAccountsCreateMock).toHaveBeenCalledWith({
        type: 'express',
        email: 'owner@flashme.test',
        business_profile: { name: 'FlashMe Studio' },
        metadata: { tenantId: 'tenant-1' },
      });

      expect(prismaServiceMock.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { stripeAccountId: 'acct_test_123' },
      });

      expect(stripeAccountLinksCreateMock).toHaveBeenCalledWith({
        account: 'acct_test_123',
        return_url:
          'http://localhost:3000/onboarding/success?tenantId=tenant-1',
        refresh_url:
          'http://localhost:3000/onboarding/refresh?tenantId=tenant-1',
        type: 'account_onboarding',
      });
    });
  });

  describe('createBookingPaymentIntent', () => {
    it('should reject payment when booking does not belong to the current user', async () => {
      bookingsServiceMock.findOneWithDetails.mockResolvedValue({
        id: 'booking-1',
        clientId: 'other-client',
        tenantId: 'tenant-1',
        tenant: {
          stripeAccountId: 'acct_test_123',
          stripeOnboardingDone: true,
        },
        client: {
          stripeCustomerId: null,
        },
        flash: {
          price: 5000,
        },
      });

      await expect(
        service.createBookingPaymentIntent({
          bookingId: 'booking-1',
          userId: 'client-1',
          userEmail: 'client@flashme.test',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(stripePaymentIntentsCreateMock).not.toHaveBeenCalled();
    });

    it('should reject payment when the studio has not completed Stripe onboarding', async () => {
      bookingsServiceMock.findOneWithDetails.mockResolvedValue({
        id: 'booking-1',
        clientId: 'client-1',
        tenantId: 'tenant-1',
        tenant: {
          stripeAccountId: null,
          stripeOnboardingDone: false,
        },
        client: {
          stripeCustomerId: null,
        },
        flash: {
          price: 5000,
        },
      });

      await expect(
        service.createBookingPaymentIntent({
          bookingId: 'booking-1',
          userId: 'client-1',
          userEmail: 'client@flashme.test',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(stripePaymentIntentsCreateMock).not.toHaveBeenCalled();
    });

    it('should create a PaymentIntent for a valid booking deposit', async () => {
      bookingsServiceMock.findOneWithDetails.mockResolvedValue({
        id: 'booking-1',
        clientId: 'client-1',
        tenantId: 'tenant-1',
        tenant: {
          stripeAccountId: 'acct_test_123',
          stripeOnboardingDone: true,
        },
        client: {
          stripeCustomerId: 'cus_existing',
        },
        flash: {
          price: 5000,
        },
      });

      stripePaymentIntentsCreateMock.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_secret',
      });

      prismaServiceMock.booking.update.mockResolvedValue({
        id: 'booking-1',
      });

      await expect(
        service.createBookingPaymentIntent({
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
        transfer_data: {
          destination: 'acct_test_123',
        },
        application_fee_amount: 150,
        metadata: {
          bookingId: 'booking-1',
          tenantId: 'tenant-1',
        },
      });

      expect(prismaServiceMock.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: {
          stripePaymentIntentId: 'pi_test_123',
          depositAmount: 1500,
        },
      });
    });
  });
});
