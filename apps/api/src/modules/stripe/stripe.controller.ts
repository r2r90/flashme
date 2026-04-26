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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import type { AuthUser } from '../../auth/decorators/current-user.decorator';
import { StartOnboardingUseCase } from './application/use-cases/start-onboarding.use-case';
import { CreatePaymentIntentUseCase } from './application/use-cases/create-payment-intent.use-case';
import { HandleWebhookUseCase } from './application/use-cases/handle-webhook.use-case';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

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
  async onboarding(@CurrentUser() user: AuthUser) {
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
  ) {
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
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) throw new ForbiddenException('Missing raw body');

    await this.handleWebhook.execute(rawBody, signature);
    return { received: true };
  }
}
