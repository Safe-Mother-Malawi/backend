import {
  Controller, Get, Post, Body, Query, Options, Param, Put, Delete,
  UseGuards, HttpCode, HttpStatus, NotFoundException,
} from '@nestjs/common';
import { HealthFacilitiesService } from './health-facilities.service';
import { HealthFacility } from './entities/health-facility.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('health-facilities')
export class HealthFacilitiesController {
  constructor(private readonly service: HealthFacilitiesService) {}

  // ── CORS preflight handling ──────────────────────────────────────────────

  @Options('*')
  @HttpCode(HttpStatus.OK)
  handleOptions() {
    return {};
  }

  // ── Public read endpoints — no auth required (reference data for signup) ──

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('district') district?: string,
    @Query('facilityType') facilityType?: string,
    @Query('managingAuthority') managingAuthority?: string,
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ) {
    if (district) {
      return this.service.getFacilitiesByDistrict(district);
    }
    return this.service.findAll({
      facilityType,
      managingAuthority,
      search,
      page: Math.max(1, page),
      limit: Math.min(limit, 500),
    });
  }

  @Get('all-districts')
  getAllDistricts() {
    return this.service.getAllDistricts();
  }

  @Get('regions')
  getRegions() {
    return this.service.getRegions();
  }

  @Get('zones')
  getZones(@Query('region') region: string) {
    return this.service.getZones(region);
  }

  @Get('districts')
  getDistricts(@Query('zone') zone: string) {
    return this.service.getDistricts(zone);
  }

  @Get('lookup')
  lookup(@Query('name') name: string) {
    return this.service.getFacilityByName(name);
  }

  @Get('facility-types')
  getFacilityTypes() {
    return this.service.getFacilityTypes();
  }

  @Get('managing-authorities')
  getManagingAuthorities() {
    return this.service.getManagingAuthorities();
  }

  @Get('facility-types-by-region')
  getFacilityTypesByRegion(@Query('region') region: string) {
    return this.service.getFacilityTypesByRegion(region);
  }

  @Get('managing-authorities-by-region')
  getManagingAuthoritiesByRegion(@Query('region') region: string) {
    return this.service.getManagingAuthoritiesByRegion(region);
  }

  @Get('facility-types-by-zone')
  getFacilityTypesByZone(@Query('zone') zone: string) {
    return this.service.getFacilityTypesByZone(zone);
  }

  @Get('managing-authorities-by-zone')
  getManagingAuthoritiesByZone(@Query('zone') zone: string) {
    return this.service.getManagingAuthoritiesByZone(zone);
  }

  @Get('facility-types-by-district')
  getFacilityTypesByDistrict(@Query('district') district: string) {
    return this.service.getFacilityTypesByDistrict(district);
  }

  @Get('managing-authorities-by-district')
  getManagingAuthoritiesByDistrict(@Query('district') district: string) {
    return this.service.getManagingAuthoritiesByDistrict(district);
  }

  // ── Protected write endpoint — admin only ─────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: Partial<HealthFacility>) {
    return this.service.create(body);
  }

  // ── Get facility by ID (must come after specific routes) ──────────────────

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string) {
    const facility = await this.service.findById(id);
    if (!facility) {
      throw new NotFoundException(`Health facility with ID ${id} not found`);
    }
    return facility;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() body: Partial<HealthFacility>) {
    const facility = await this.service.update(id, body);
    if (!facility) {
      throw new NotFoundException(`Health facility with ID ${id} not found`);
    }
    return facility;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    const result = await this.service.delete(id);
    if (!result) {
      throw new NotFoundException(`Health facility with ID ${id} not found`);
    }
    return { message: 'Health facility deleted successfully' };
  }
}
