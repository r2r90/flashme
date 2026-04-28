import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Tenant } from '@prisma/client';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantsService } from './tenants.service';
@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new studio' })
  @ApiResponse({ status: 201, description: 'Studio created' })
  @ApiResponse({ status: 409, description: 'Slug already taken' })
  create(@Body() dto: CreateTenantDto): Promise<Tenant> {
    return this.tenantsService.create(dto.name, dto.slug);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get studio by slug' })
  @ApiResponse({ status: 200, description: 'Studio found' })
  @ApiResponse({ status: 404, description: 'Studio not found' })
  findBySlug(@Param('slug') slug: string): Promise<Tenant | null> {
    return this.tenantsService.findBySlug(slug);
  }
}
