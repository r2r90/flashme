import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class VerifyEmailUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new UnauthorizedException('Verification token has expired');
    }

    // Mark as verified and clear token (single-use)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
  }
}
