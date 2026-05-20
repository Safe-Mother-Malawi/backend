import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

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

  @Get('geographic-insights')
  getGeographicInsights() {
    return this.service.getGeographicInsights();
  }

  @Get('neonatal-analytics')
  getNeonatalAnalytics() {
    return this.service.getNeonatalAnalytics();
  }

  @Get('system-alerts')
  getSystemAlerts() {
    return this.service.getSystemAlerts();
  }

  @Get('task-analytics')
  getTaskAnalytics() {
    return this.service.getTaskAnalytics();
  }

  @Get('anc-analytics')
  getANCAnalytics(@Query('district') district?: string) {
    return this.service.getANCAnalytics(district);
  }

  @Get('anc-compliance')
  getANCComplianceSummary(@Query('district') district?: string) {
    return this.service.getANCComplianceSummary(district);
  }

  @Get('clinician-dashboard')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  getClinicianDashboard(
    @CurrentUser() user: User,
    @Query('clinicianId') clinicianId?: string,
  ) {
    const effectiveId = user.role === UserRole.CLINICIAN ? user.id : clinicianId;
    if (!effectiveId) throw new Error('clinicianId is required for admins');
    return this.service.getClinicianDashboard(effectiveId);
  }
}
