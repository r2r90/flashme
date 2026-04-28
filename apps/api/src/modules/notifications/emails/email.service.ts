import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { verificationEmailTemplate } from './templates/verification-email.template';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
    this.fromEmail = this.configService.get<string>(
      'FROM_EMAIL',
      'onboarding@resend.dev',
    );
  }

  /**
   * Send email verification link to newly registered user.
   */
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    const { subject, html } = verificationEmailTemplate(verificationUrl);

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      this.logger.log(`Verification email sent to ${this.maskEmail(to)}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${this.maskEmail(to)}`,
        error,
      );
    }
  }

  /**
   * Mask email for safe logging — "john@gmail.com" → "j***@gmail.com"
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local[0]}***@${domain}`;
  }
}
