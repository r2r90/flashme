import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { StripeController } from './stripe.controller';
import { StartOnboardingUseCase } from './application/use-cases/start-onboarding.use-case';
import { CreatePaymentIntentUseCase } from './application/use-cases/create-payment-intent.use-case';
import { HandleWebhookUseCase } from './application/use-cases/handle-webhook.use-case';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '../../auth/decorators/current-user.decorator';

describe('StripeController', () => {
  let controller: StripeController;

  const startOnboardingMock = { execute: jest.fn() };
  const createPaymentIntentMock = { execute: jest.fn() };
  const handleWebhookMock = { execute: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        { provide: StartOnboardingUseCase, useValue: startOnboardingMock },
        {
          provide: CreatePaymentIntentUseCase,
          useValue: createPaymentIntentMock,
        },
        { provide: HandleWebhookUseCase, useValue: handleWebhookMock },
      ],
    }).compile();

    controller = module.get<StripeController>(StripeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('onboarding', () => {
    it('should return an onboarding URL for the current owner tenant', async () => {
      const user: AuthUser = {
        id: 'user-1',
        email: 'owner@flashme.test',
        role: Role.OWNER,
        tenantId: 'tenant-1',
      };

      startOnboardingMock.execute.mockResolvedValue(
        'https://connect.stripe.com/onboarding/test',
      );

      await expect(controller.onboarding(user)).resolves.toEqual({
        onboardingUrl: 'https://connect.stripe.com/onboarding/test',
      });

      expect(startOnboardingMock.execute).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        email: 'owner@flashme.test',
      });
    });
  });

  describe('paymentIntent', () => {
    it('should create a payment intent for the current client booking', async () => {
      const user: AuthUser = {
        id: 'client-1',
        email: 'client@flashme.test',
        role: Role.CLIENT,
        tenantId: 'tenant-1',
      };

      const dto = { bookingId: 'booking-1' };

      const response = { clientSecret: 'pi_test_secret', depositAmount: 1500 };

      createPaymentIntentMock.execute.mockResolvedValue(response);

      await expect(controller.paymentIntent(dto, user)).resolves.toEqual(
        response,
      );

      expect(createPaymentIntentMock.execute).toHaveBeenCalledWith({
        bookingId: 'booking-1',
        userId: 'client-1',
        userEmail: 'client@flashme.test',
      });
    });
  });

  describe('webhook', () => {
    it('should handle a Stripe webhook event and return received true', async () => {
      const rawBody = Buffer.from('{"type":"payment_intent.succeeded"}');
      const req = { rawBody } as RawBodyRequest<Request>;
      const signature = 'stripe-signature-test';

      handleWebhookMock.execute.mockResolvedValue(undefined);

      await expect(controller.webhook(req, signature)).resolves.toEqual({
        received: true,
      });

      expect(handleWebhookMock.execute).toHaveBeenCalledWith(
        rawBody,
        signature,
      );
    });

    it('should throw ForbiddenException when raw body is missing', async () => {
      const req = {} as RawBodyRequest<Request>;
      const signature = 'stripe-signature-test';

      await expect(controller.webhook(req, signature)).rejects.toThrow(
        ForbiddenException,
      );

      expect(handleWebhookMock.execute).not.toHaveBeenCalled();
    });
  });
});
