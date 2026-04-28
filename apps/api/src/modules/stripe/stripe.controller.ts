import type {
  AuthUser,
  OnboardingResponse,
  PaymentIntentResponse,
  WebhookResponse,
} from '@/shared/types';
import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  type RawBodyRequest,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { CreatePaymentIntentUseCase } from './application/use-cases/create-payment-intent.use-case';
import { HandleWebhookUseCase } from './application/use-cases/handle-webhook.use-case';
import { StartOnboardingUseCase } from './application/use-cases/start-onboarding.use-case';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@ApiTags('Stripe')
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
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Start Stripe Connect onboarding for a studio' })
  @ApiResponse({ status: 201, description: 'Returns Stripe onboarding URL' })
  @ApiResponse({ status: 400, description: 'Onboarding already completed' })
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
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Create a Stripe PaymentIntent for a booking deposit',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns client secret and deposit amount',
  })
  @ApiResponse({
    status: 400,
    description: 'Deposit already paid or studio not onboarded',
  })
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
  @ApiOperation({ summary: 'Stripe webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook received' })
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
