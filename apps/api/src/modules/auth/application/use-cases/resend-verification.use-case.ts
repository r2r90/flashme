import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { EmailService } from '@/modules/notifications/emails/email.service';
import { randomBytes } from 'crypto';

const TOKEN_BYTES = 32;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class ResendVerificationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Resend verification email with a fresh token.
   * Silent return if email not found or already verified — prevents email enumeration.
   */
  async execute(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.emailVerifiedAt) return;

    const token = randomBytes(TOKEN_BYTES).toString('hex');
    const expires = new Date(Date.now() + VERIFICATION_TTL_MS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expires,
      },
    });

    await this.emailService.sendVerificationEmail(email, token);
  }
}
