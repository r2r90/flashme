import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { type AuthUser } from '@/shared/types';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Create a booking for a flash' })
  @ApiResponse({ status: 201, description: 'Booking created' })
  @ApiResponse({ status: 400, description: 'Flash not available' })
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: AuthUser) {
    return this.bookingsService.create(dto, user.id);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Get my bookings as client' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  findMyBookings(@CurrentUser() user: AuthUser) {
    return this.bookingsService.findAllByClient(user.id);
  }

  @Get('artist/me')
  @UseGuards(RolesGuard)
  @Roles(Role.ARTIST)
  @ApiOperation({ summary: 'Get bookings for my flashes as artist' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  findMyArtistBookings(@CurrentUser() user: AuthUser) {
    return this.bookingsService.findAllByArtist(user.id);
  }

  @Get('tenant')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Get all bookings for my studio' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  findTenantBookings(@CurrentUser() user: AuthUser) {
    return this.bookingsService.findAllByTenant(user.tenantId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ARTIST, Role.OWNER)
  @ApiOperation({ summary: 'Update booking status or date' })
  @ApiResponse({ status: 200, description: 'Booking updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.bookingsService.update(id, dto);
  }
}
