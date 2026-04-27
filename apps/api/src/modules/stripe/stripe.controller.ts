import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
  type RawBodyRequest,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { StartOnboardingUseCase } from './application/use-cases/start-onboarding.use-case';
import { CreatePaymentIntentUseCase } from './application/use-cases/create-payment-intent.use-case';
import { HandleWebhookUseCase } from './application/use-cases/handle-webhook.use-case';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import type {
  AuthUser,
  OnboardingResponse,
  PaymentIntentResponse,
  WebhookResponse,
} from '@/shared/types';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly startOnboarding: StartOnboardingUseCase,
    private readonly createPaymentIntent: CreatePaymentIntentUseCase,
    private readonly handleWebhook: HandleWebhookUseCase,
  ) {}

  @Post('onboarding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async onboarding(@CurrentUser() user: AuthUser): Promise<OnboardingResponse> {
    if (!user.tenantId) {
      throw new ForbiddenException('No tenant associated with this account');
    }
    const onboardingUrl = await this.startOnboarding.execute({
      tenantId: user.tenantId,
      email: user.email,
    });
    return { onboardingUrl };
  }

  @Post('payment-intent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  async paymentIntent(
    @Body() dto: CreatePaymentIntentDto,
    @CurrentUser() user: AuthUser,
  ): Promise<PaymentIntentResponse> {
    return this.createPaymentIntent.execute({
      bookingId: dto.bookingId,
      userId: user.id,
      userEmail: user.email,
    });
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<WebhookResponse> {
    const rawBody = req.rawBody;
    if (!rawBody) throw new ForbiddenException('Missing raw body');
    await this.handleWebhook.execute(rawBody, signature);
    return { received: true };
  }
}
