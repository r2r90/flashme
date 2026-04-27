import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { EmailService } from '@/modules/notifications/emails/email.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 10;
const TOKEN_BYTES = 32;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async execute(email: string, password: string, tenantId: string) {
    // Prevent duplicate registration
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const token = randomBytes(TOKEN_BYTES).toString('hex');
    const expires = new Date(Date.now() + VERIFICATION_TTL_MS);

    await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        tenantId,
        emailVerificationToken: token,
        emailVerificationExpires: expires,
      },
    });

    // Non-blocking — email failure does not prevent registration
    await this.emailService.sendVerificationEmail(email, token);

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }
}
