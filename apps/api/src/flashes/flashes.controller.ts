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
import { CreateFlashDto } from './dto/create-flash.dto';
import { UpdateFlashStatusDto } from './dto/update-flash-status.dto';

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
  updateStatus(@Param('id') id: string, @Body() dto: UpdateFlashStatusDto) {
    return this.flashesService.updateStatus(id, dto.status);
  }
}
