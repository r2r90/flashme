import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtStrategy } from '@/modules/auth/jwt.strategy';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { ResendVerificationUseCase } from './application/use-cases/resend-verification.use-case';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    UsersModule,
    NotificationsModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    RegisterUseCase,
    VerifyEmailUseCase,
    ResendVerificationUseCase,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
