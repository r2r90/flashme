import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HandleWebhookUseCase } from './handle-webhook.use-case';
import { StripeClientService } from '../../infrastructure/stripe-client.service';
import { StripeBookingRepository } from '../../infrastructure/repositories/stripe-booking.repository';
import { StripeTenantRepository } from '../../infrastructure/repositories/stripe-tenant.repository';

const stripeWebhooksConstructEventMock = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent: stripeWebhooksConstructEventMock },
  }));
});

describe('HandleWebhookUseCase', () => {
  let useCase: HandleWebhookUseCase;

  const configServiceMock = {
    getOrThrow: jest.fn((key: string): string => {
      const config: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_fake',
        STRIPE_COMMISSION_RATE: '0.10',
        STRIPE_WEBHOOK_SECRET: 'whsec_fake',
      };
      const value = config[key];
      if (!value) throw new Error(`Missing test config key: ${key}`);
      return value;
    }),
  };

  const bookingRepoMock = {
    findByPaymentIntentId: jest.fn(),
    markDepositPaid: jest.fn(),
  };

  const tenantRepoMock = {
    updateOnboardingStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleWebhookUseCase,
        { provide: ConfigService, useValue: configServiceMock },
        {
          provide: StripeClientService,
          useValue: new StripeClientService(
            configServiceMock as unknown as ConfigService,
          ),
        },
        { provide: StripeBookingRepository, useValue: bookingRepoMock },
        { provide: StripeTenantRepository, useValue: tenantRepoMock },
      ],
    }).compile();

    useCase = module.get<HandleWebhookUseCase>(HandleWebhookUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw BadRequestException when webhook signature is invalid', async () => {
      stripeWebhooksConstructEventMock.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        useCase.execute(Buffer.from('payload'), 'invalid-signature'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle payment_intent.succeeded and mark deposit paid', async () => {
      stripeWebhooksConstructEventMock.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test_123' } },
      });

      bookingRepoMock.findByPaymentIntentId.mockResolvedValue({
        id: 'booking-1',
        flashId: 'flash-1',
        depositPaid: false,
      });

      bookingRepoMock.markDepositPaid.mockResolvedValue(undefined);

      await expect(
        useCase.execute(Buffer.from('payload'), 'valid-signature'),
      ).resolves.toBeUndefined();

      expect(bookingRepoMock.markDepositPaid).toHaveBeenCalledWith(
        'booking-1',
        'flash-1',
      );
    });

    it('should skip already processed payment_intent.succeeded', async () => {
      stripeWebhooksConstructEventMock.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test_123' } },
      });

      bookingRepoMock.findByPaymentIntentId.mockResolvedValue({
        id: 'booking-1',
        flashId: 'flash-1',
        depositPaid: true,
      });

      await useCase.execute(Buffer.from('payload'), 'valid-signature');

      expect(bookingRepoMock.markDepositPaid).not.toHaveBeenCalled();
    });

    it('should handle account.updated and update onboarding status', async () => {
      stripeWebhooksConstructEventMock.mockReturnValue({
        type: 'account.updated',
        data: {
          object: {
            id: 'acct_test_123',
            charges_enabled: true,
            payouts_enabled: true,
            details_submitted: true,
          },
        },
      });

      tenantRepoMock.updateOnboardingStatus.mockResolvedValue(undefined);

      await useCase.execute(Buffer.from('payload'), 'valid-signature');

      expect(tenantRepoMock.updateOnboardingStatus).toHaveBeenCalledWith(
        'acct_test_123',
        {
          chargesEnabled: true,
          payoutsEnabled: true,
          detailsSubmitted: true,
          onboardingDone: true,
        },
      );
    });
  });
});
