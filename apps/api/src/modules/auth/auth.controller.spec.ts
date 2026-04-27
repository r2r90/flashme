import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { ResendVerificationUseCase } from './application/use-cases/resend-verification.use-case';

const mockAuthService = {
  login: jest.fn().mockResolvedValue({
    accessToken: 'token',
    refreshToken: 'refresh',
    user: {},
  }),
};

const mockRegisterUseCase = {
  execute: jest.fn().mockResolvedValue({
    message:
      'Registration successful. Please check your email to verify your account.',
  }),
};

const mockVerifyEmailUseCase = {
  execute: jest.fn().mockResolvedValue(undefined),
};

const mockResendVerificationUseCase = {
  execute: jest.fn().mockResolvedValue(undefined),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: RegisterUseCase, useValue: mockRegisterUseCase },
        { provide: VerifyEmailUseCase, useValue: mockVerifyEmailUseCase },
        {
          provide: ResendVerificationUseCase,
          useValue: mockResendVerificationUseCase,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call RegisterUseCase and return message', async () => {
      const dto = {
        email: 'test@test.com',
        password: 'password123',
        tenantId: 'tenant-123',
      };

      const expectedResponse = {
        message:
          'Registration successful. Please check your email to verify your account.',
      };

      mockRegisterUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await controller.register(dto);

      expect(mockRegisterUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('verify-email', () => {
    it('should call VerifyEmailUseCase and return success message', async () => {
      const result = await controller.verifyEmail({ token: 'valid-token' });

      expect(mockVerifyEmailUseCase.execute).toHaveBeenCalledWith(
        'valid-token',
      );
      expect(result).toHaveProperty('message');
    });
  });

  describe('resend-verification', () => {
    it('should call ResendVerificationUseCase and return message', async () => {
      const result = await controller.resendVerification({
        email: 'test@test.com',
      });

      expect(mockResendVerificationUseCase.execute).toHaveBeenCalledWith(
        'test@test.com',
      );
      expect(result).toHaveProperty('message');
    });
  });
});
