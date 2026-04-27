import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { FlashesService } from './flashes.service';
import { CreateFlashDto } from './dto/create-flash.dto';
import { UpdateFlashStatusDto } from './dto/update-flash-status.dto';
import { Flash, Role } from '@prisma/client';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { FlashWithArtist } from '@/shared/types/flash.types';

@Controller('flashes')
export class FlashesController {
  constructor(private flashesService: FlashesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ARTIST, Role.OWNER)
  create(@Body() dto: CreateFlashDto): Promise<Flash> {
    return this.flashesService.create(dto);
  }

  @Get('tenant/:tenantId')
  findAllByTenant(@Param('tenantId') tenantId: string): Promise<FlashWithArtist[]> {
    return this.flashesService.findAllByTenant(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<FlashWithArtist> {
    return this.flashesService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ARTIST, Role.OWNER)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateFlashStatusDto): Promise<Flash> {
    return this.flashesService.updateStatus(id, dto.status);
  }
}
