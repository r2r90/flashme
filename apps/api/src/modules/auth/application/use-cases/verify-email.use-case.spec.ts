import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { VerifyEmailUseCase } from './verify-email.use-case';
import { PrismaService } from '@/shared/prisma/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerifyEmailUseCase, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    useCase = module.get<VerifyEmailUseCase>(VerifyEmailUseCase);
    jest.clearAllMocks();
  });

  it('should verify email and clear token', async () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      emailVerificationExpires: futureDate,
    });

    await useCase.execute('valid-token');

    expect(mockPrisma.user.update).toHaveBeenCalled();
    const updateArg = mockPrisma.user.update.mock.calls[0] as unknown as [
      {
        where: { id: string };
        data: {
          emailVerifiedAt: Date;
          emailVerificationToken: null;
          emailVerificationExpires: null;
        };
      },
    ];
    expect(updateArg[0].where.id).toBe('user-1');
    expect(updateArg[0].data.emailVerifiedAt).toBeInstanceOf(Date);
    expect(updateArg[0].data.emailVerificationToken).toBeNull();
    expect(updateArg[0].data.emailVerificationExpires).toBeNull();
  });

  it('should throw if token is invalid', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(useCase.execute('bad-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw if token is expired', async () => {
    const pastDate = new Date(Date.now() - 60 * 60 * 1000);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      emailVerificationExpires: pastDate,
    });

    await expect(useCase.execute('expired-token')).rejects.toThrow(UnauthorizedException);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});
