import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StartOnboardingUseCase } from './start-onboarding.use-case';
import { TenantsService } from '../../../../tenants/tenants.service';
import { StripeClientService } from '../../infrastructure/stripe-client.service';
import { StripeTenantRepository } from '../../infrastructure/repositories/stripe-tenant.repository';

const stripeAccountsCreateMock = jest.fn();
const stripeAccountLinksCreateMock = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    accounts: { create: stripeAccountsCreateMock },
    accountLinks: { create: stripeAccountLinksCreateMock },
  }));
});

describe('StartOnboardingUseCase', () => {
  let useCase: StartOnboardingUseCase;

  const configServiceMock = {
    getOrThrow: jest.fn((key: string): string => {
      const config: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_fake',
        STRIPE_COMMISSION_RATE: '0.10',
        FRONTEND_URL: 'http://localhost:3000',
      };
      const value = config[key];
      if (!value) throw new Error(`Missing test config key: ${key}`);
      return value;
    }),
  };

  const tenantsServiceMock = { findById: jest.fn() };
  const tenantRepoMock = { saveAccountId: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartOnboardingUseCase,
        { provide: ConfigService, useValue: configServiceMock },
        {
          provide: StripeClientService,
          useValue: new StripeClientService(
            configServiceMock as unknown as ConfigService,
          ),
        },
        { provide: TenantsService, useValue: tenantsServiceMock },
        { provide: StripeTenantRepository, useValue: tenantRepoMock },
      ],
    }).compile();

    useCase = module.get<StartOnboardingUseCase>(StartOnboardingUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should reject onboarding when tenant already completed it', async () => {
      tenantsServiceMock.findById.mockResolvedValue({
        id: 'tenant-1',
        name: 'FlashMe Studio',
        stripeAccountId: 'acct_existing',
        stripeOnboardingDone: true,
      });

      await expect(
        useCase.execute({ tenantId: 'tenant-1', email: 'owner@flashme.test' }),
      ).rejects.toThrow(BadRequestException);

      expect(stripeAccountsCreateMock).not.toHaveBeenCalled();
      expect(stripeAccountLinksCreateMock).not.toHaveBeenCalled();
    });

    it('should create a Connect account and return onboarding link', async () => {
      tenantsServiceMock.findById.mockResolvedValue({
        id: 'tenant-1',
        name: 'FlashMe Studio',
        stripeAccountId: null,
        stripeOnboardingDone: false,
      });

      stripeAccountsCreateMock.mockResolvedValue({ id: 'acct_test_123' });
      stripeAccountLinksCreateMock.mockResolvedValue({
        url: 'https://connect.stripe.com/onboarding/test',
      });
      tenantRepoMock.saveAccountId.mockResolvedValue(undefined);

      await expect(
        useCase.execute({ tenantId: 'tenant-1', email: 'owner@flashme.test' }),
      ).resolves.toBe('https://connect.stripe.com/onboarding/test');

      expect(stripeAccountsCreateMock).toHaveBeenCalledWith({
        type: 'express',
        email: 'owner@flashme.test',
        business_profile: { name: 'FlashMe Studio' },
        metadata: { tenantId: 'tenant-1' },
      });

      expect(tenantRepoMock.saveAccountId).toHaveBeenCalledWith(
        'tenant-1',
        'acct_test_123',
      );

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
});
