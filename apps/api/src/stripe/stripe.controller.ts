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
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

interface JwtPayload {
  id: string;
  email: string;
  role: Role;
  tenantId: string;
}

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  /**
   * POST /stripe/onboarding
   * Returns a Stripe hosted onboarding URL for the studio.
   */
  @Post('onboarding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async startOnboarding(@CurrentUser() user: JwtPayload) {
    const onboardingUrl = await this.stripeService.startOnboarding({
      tenantId: user.tenantId,
      email: user.email,
    });

    return { onboardingUrl };
  }

  /**
   * POST /stripe/payment-intent
   * Creates a PaymentIntent for a booking deposit.
   */
  @Post('payment-intent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  async createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.stripeService.createBookingPaymentIntent({
      bookingId: dto.bookingId,
      userId: user.id,
      userEmail: user.email,
    });
  }

  /**
   * POST /stripe/webhook
   * Public endpoint — no JWT. Stripe signature verified inside service.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) throw new ForbiddenException('Missing raw body');

    await this.stripeService.handleWebhookEvent(rawBody, signature);
    return { received: true };
  }
}
