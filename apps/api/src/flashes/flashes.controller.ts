import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FlashesService } from './flashes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FlashStatus } from '@prisma/client';

class CreateFlashDto {
  tenantId: string;
  artistId: string;
  title: string;
  description?: string;
  imageUrl: string;
  price: number;
}

@Controller('flashes')
export class FlashesController {
  constructor(private flashesService: FlashesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateFlashDto) {
    return this.flashesService.create(dto);
  }

  @Get('tenant/:tenantId')
  findAllByTenant(@Param('tenantId') tenantId: string) {
    return this.flashesService.findAllByTenant(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flashesService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: FlashStatus) {
    return this.flashesService.updateStatus(id, status);
  }
}
