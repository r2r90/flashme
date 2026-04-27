import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Tenant } from '@prisma/client';

@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto): Promise<Tenant> {
    return this.tenantsService.create(dto.name, dto.slug);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string): Promise<Tenant | null> {
    return this.tenantsService.findBySlug(slug);
  }
}
