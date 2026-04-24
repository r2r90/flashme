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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateFlashDto } from './dto/create-flash.dto';
import { UpdateFlashStatusDto } from './dto/update-flash-status.dto';
import { Role } from '@prisma/client';

@Controller('flashes')
export class FlashesController {
  constructor(private flashesService: FlashesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ARTIST, Role.OWNER)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ARTIST, Role.OWNER)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateFlashStatusDto) {
    return this.flashesService.updateStatus(id, dto.status);
  }
}
