import { Module } from '@nestjs/common';
import { EmailService } from './emails/email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationsModule {}
