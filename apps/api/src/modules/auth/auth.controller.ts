import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { ResendVerificationUseCase } from './application/use-cases/resend-verification.use-case';
import { LoginResponse, MessageResponse } from '@/shared/types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly registerUseCase: RegisterUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
  ) {}

  @Post('login')
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<MessageResponse> {
    return this.registerUseCase.execute({
      email: dto.email,
      password: dto.password,
      tenantId: dto.tenantId,
    });
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.verifyEmailUseCase.execute(dto.token);
    return { message: 'Email verified successfully. You can now log in.' };
  }

  @Post('resend-verification')
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.resendVerificationUseCase.execute(dto.email);
    // Always return success — prevents email enumeration
    return {
      message: 'If this email is registered, a verification link has been sent.',
    };
  }
}
