import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Role } from '@prisma/client';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: AuthUser) {
    return this.bookingsService.create(dto, user.tenantId);
  }

  @Get('artist/:artistId')
  @UseGuards(RolesGuard)
  @Roles(Role.ARTIST, Role.OWNER)
  findAllByArtist(@Param('artistId') artistId: string) {
    return this.bookingsService.findAllByArtist(artistId);
  }

  @Get('client/:clientId')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  findAllByClient(@Param('clientId') clientId: string) {
    return this.bookingsService.findAllByClient(clientId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ARTIST, Role.OWNER)
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.bookingsService.update(id, dto);
  }
}
