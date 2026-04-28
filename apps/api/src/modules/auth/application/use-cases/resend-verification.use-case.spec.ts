import { Test, TestingModule } from '@nestjs/testing';
import { ResendVerificationUseCase } from './resend-verification.use-case';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { EmailService } from '@/modules/notifications/emails/email.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockEmailService = {
  sendVerificationEmail: jest.fn(),
};

describe('ResendVerificationUseCase', () => {
  let useCase: ResendVerificationUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendVerificationUseCase,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    useCase = module.get<ResendVerificationUseCase>(ResendVerificationUseCase);
    jest.clearAllMocks();
  });

  it('should generate new token and send email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      emailVerifiedAt: null,
    });

    await useCase.execute('test@test.com');

    expect(mockPrisma.user.update).toHaveBeenCalled();
    const updateArg = mockPrisma.user.update.mock.calls[0] as unknown as [
      {
        data: {
          emailVerificationToken: string;
          emailVerificationExpires: Date;
        };
      },
    ];
    expect(typeof updateArg[0].data.emailVerificationToken).toBe('string');
    expect(updateArg[0].data.emailVerificationExpires).toBeInstanceOf(Date);

    expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    const emailArg = mockEmailService.sendVerificationEmail.mock
      .calls[0] as unknown as [string, string];
    expect(emailArg[0]).toBe('test@test.com');
    expect(typeof emailArg[1]).toBe('string');
  });

  it('should silently return if email not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await useCase.execute('unknown@test.com');

    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('should silently return if email already verified', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      emailVerifiedAt: new Date(),
    });

    await useCase.execute('verified@test.com');

    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
  });
});
