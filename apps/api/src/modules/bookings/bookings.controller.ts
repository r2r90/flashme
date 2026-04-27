import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Roles } from '@/shared/decorators/roles.decorator';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { type AuthUser } from '@/shared/types';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: AuthUser) {
    return this.bookingsService.create(dto, user.id);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  findMyBookings(@CurrentUser() user: AuthUser) {
    return this.bookingsService.findAllByClient(user.id);
  }

  @Get('artist/me')
  @UseGuards(RolesGuard)
  @Roles(Role.ARTIST)
  findMyArtistBookings(@CurrentUser() user: AuthUser) {
    return this.bookingsService.findAllByArtist(user.id);
  }

  @Get('tenant')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  findTenantBookings(@CurrentUser() user: AuthUser) {
    return this.bookingsService.findAllByTenant(user.tenantId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ARTIST, Role.OWNER)
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.bookingsService.update(id, dto);
  }
}
