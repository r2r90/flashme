import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { RegisterUseCase } from './register.use-case';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { EmailService } from '@/modules/notifications/emails/email.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockEmailService = {
  sendVerificationEmail: jest.fn(),
};

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    useCase = module.get<RegisterUseCase>(RegisterUseCase);
    jest.clearAllMocks();
  });

  it('should register a new user and send verification email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: 'user-1' });

    const result = await useCase.execute({
      email: 'test@test.com',
      password: 'password123',
      tenantId: 'tenant-1',
    });

    expect(result).toHaveProperty('message');
    expect(mockPrisma.user.create).toHaveBeenCalled();

    const createArg = mockPrisma.user.create.mock.calls[0] as unknown as [
      {
        data: {
          email: string;
          tenantId: string;
          emailVerificationToken: string;
          emailVerificationExpires: Date;
        };
      },
    ];
    expect(createArg[0].data.email).toBe('test@test.com');
    expect(createArg[0].data.tenantId).toBe('tenant-1');
    expect(typeof createArg[0].data.emailVerificationToken).toBe('string');
    expect(createArg[0].data.emailVerificationExpires).toBeInstanceOf(Date);

    expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    const emailArg = mockEmailService.sendVerificationEmail.mock
      .calls[0] as unknown as [string, string];
    expect(emailArg[0]).toBe('test@test.com');
    expect(typeof emailArg[1]).toBe('string');
  });

  it('should throw ConflictException if email already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    await expect(
      useCase.execute({
        email: 'test@test.com',
        password: 'password123',
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow(ConflictException);

    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
  });
});
