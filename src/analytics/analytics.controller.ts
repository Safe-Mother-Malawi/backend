import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.DHO, UserRole.CLINICIAN)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('overview')
  getOverview() {
    return this.service.getOverview();
  }

  @Get('registrations')
  getRegistrationTrends() {
    return this.service.getRegistrationTrends();
  }

  @Get('risk-distribution')
  getRiskDistribution() {
    return this.service.getRiskDistribution();
  }

  @Get('high-risk-cases')
  getHighRiskCases() {
    return this.service.getHighRiskCases();
  }

  @Get('districts')
  getAllDistrictStats() {
    return this.service.getAllDistrictStats();
  }

  @Get('districts/:district')
  getDistrictStats(@Param('district') district: string) {
    return this.service.getDistrictStats(district);
  }

  @Get('system-alerts')
  getSystemAlerts() {
    return this.service.getSystemAlerts();
  }

  @Get('task-analytics')
  getTaskAnalytics() {
    return this.service.getTaskAnalytics();
  }

  /** GET /api/v1/analytics/ivr — IVR call stats for DHO/admin dashboard */
  @Get('ivr')
  getIvrStats(
    @Query('from') from?: string,
    @Query('to')   to?: string,
  ) {
    return this.service.getIvrStats(
      from ? new Date(from) : undefined,
      to   ? new Date(to)   : undefined,
    );
  }
}
