import { Roles } from '@/shared/decorators/roles.decorator';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { FlashWithArtist } from '@/shared/types/flash.types';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Flash, Role } from '@prisma/client';
import { CreateFlashDto } from './dto/create-flash.dto';
import { UpdateFlashStatusDto } from './dto/update-flash-status.dto';
import { FlashesService } from './flashes.service';

@ApiTags('Flashes')
@Controller('flashes')
export class FlashesController {
  constructor(private flashesService: FlashesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ARTIST, Role.OWNER)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new flash' })
  @ApiResponse({ status: 201, description: 'Flash created' })
  @ApiResponse({ status: 400, description: 'Invalid artist or price' })
  create(@Body() dto: CreateFlashDto): Promise<Flash> {
    return this.flashesService.create(dto);
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get all available flashes for a studio' })
  @ApiResponse({ status: 200, description: 'List of available flashes' })
  findAllByTenant(
    @Param('tenantId') tenantId: string,
  ): Promise<FlashWithArtist[]> {
    return this.flashesService.findAllByTenant(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a flash by ID' })
  @ApiResponse({ status: 200, description: 'Flash detail' })
  @ApiResponse({ status: 404, description: 'Flash not found' })
  findOne(@Param('id') id: string): Promise<FlashWithArtist> {
    return this.flashesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update flash status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'Flash not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ARTIST, Role.OWNER)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFlashStatusDto,
  ): Promise<Flash> {
    return this.flashesService.updateStatus(id, dto.status);
  }
}
