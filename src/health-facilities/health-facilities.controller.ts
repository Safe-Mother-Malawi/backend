import {
  Controller, Get, Post, Body, Query, Options,
  UseGuards, HttpCode, HttpStatus,
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

  // ── Protected write endpoint — admin only ─────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: Partial<HealthFacility>) {
    return this.service.create(body);
  }
}
