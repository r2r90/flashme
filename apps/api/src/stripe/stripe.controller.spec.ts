import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { type RawBodyRequest } from '@nestjs/common';
import { type Request } from 'express';

describe('StripeController', () => {
  let controller: StripeController;

  const stripeServiceMock = {
    startOnboarding: jest.fn(),
    createBookingPaymentIntent: jest.fn(),
    handleWebhookEvent: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        {
          provide: StripeService,
          useValue: stripeServiceMock,
        },
      ],
    }).compile();

    controller = module.get<StripeController>(StripeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('startOnboarding', () => {
    it('should return an onboarding URL for the current owner tenant', async () => {
      const user = {
        sub: 'user-1',
        email: 'owner@flashme.test',
        role: Role.OWNER,
        tenantId: 'tenant-1',
      };

      stripeServiceMock.startOnboarding.mockResolvedValue(
        'https://connect.stripe.com/onboarding/test',
      );

      await expect(controller.startOnboarding(user)).resolves.toEqual({
        onboardingUrl: 'https://connect.stripe.com/onboarding/test',
      });

      expect(stripeServiceMock.startOnboarding).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        email: 'owner@flashme.test',
      });
    });
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent for the current client booking', async () => {
      const user = {
        sub: 'client-1',
        email: 'client@flashme.test',
        role: Role.CLIENT,
        tenantId: 'tenant-1',
      };

      const dto = {
        bookingId: 'booking-1',
      };

      const paymentIntentResponse = {
        clientSecret: 'pi_test_secret',
        depositAmount: 1500,
      };

      stripeServiceMock.createBookingPaymentIntent.mockResolvedValue(
        paymentIntentResponse,
      );

      await expect(controller.createPaymentIntent(dto, user)).resolves.toEqual(
        paymentIntentResponse,
      );

      expect(stripeServiceMock.createBookingPaymentIntent).toHaveBeenCalledWith(
        {
          bookingId: 'booking-1',
          userId: 'client-1',
          userEmail: 'client@flashme.test',
        },
      );
    });
  });

  describe('handleWebhook', () => {
    it('should handle a Stripe webhook event and return received true', async () => {
      const rawBody = Buffer.from('{"type":"payment_intent.succeeded"}');
      const req = { rawBody } as RawBodyRequest<Request>;
      const signature = 'stripe-signature-test';

      stripeServiceMock.handleWebhookEvent.mockResolvedValue(undefined);

      await expect(controller.handleWebhook(req, signature)).resolves.toEqual({
        received: true,
      });

      expect(stripeServiceMock.handleWebhookEvent).toHaveBeenCalledWith(
        rawBody,
        signature,
      );
    });

    it('should throw ForbiddenException when raw body is missing', async () => {
      const req = {} as RawBodyRequest<Request>;
      const signature = 'stripe-signature-test';

      await expect(controller.handleWebhook(req, signature)).rejects.toThrow(
        ForbiddenException,
      );

      expect(stripeServiceMock.handleWebhookEvent).not.toHaveBeenCalled();
    });
  });
});
