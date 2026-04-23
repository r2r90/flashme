import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { TenantsService } from './tenants.service';

class CreateTenantDto {
  name: string;
  slug: string;
}

@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto.name, dto.slug);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }
}
