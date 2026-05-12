import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ANCTrackingService, ANCComplianceReport } from './services/anc-tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ANCVisitType } from './entities/appointment.entity';

@Controller('anc')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ANCController {
  constructor(private readonly ancService: ANCTrackingService) {}

  /**
   * POST /anc/appointments
   * Create a new ANC appointment with tracking
   */
  @Post('appointments')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  async createANCAppointment(@Body() dto: {
    patientId: string;
    patientName: string;
    patientContact: string;
    date: string;
    time?: string;
    location?: string;
    clinicianId?: string;
    visitType: ANCVisitType;
    visitNumber?: number;
    gestationalWeeks?: number;
    notes?: string;
  }) {
    return this.ancService.createANCAppointment(dto);
  }

  /**
   * PUT /anc/appointments/:id/attended
   * Mark ANC appointment as attended
   */
  @Put('appointments/:id/attended')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  async markAttended(
    @Param('id') appointmentId: string,
    @Body() dto: { attendanceNotes?: string },
  ) {
    return this.ancService.markANCAttended(appointmentId, dto.attendanceNotes);
  }

  /**
   * PUT /anc/appointments/:id/no-show
   * Mark ANC appointment as no-show
   */
  @Put('appointments/:id/no-show')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  async markNoShow(
    @Param('id') appointmentId: string,
    @Body() dto: { reason?: string },
  ) {
    return this.ancService.markANCNoShow(appointmentId, dto.reason);
  }

  /**
   * GET /anc/compliance/:patientId
   * Get ANC compliance report for a specific patient
   */
  @Get('compliance/:patientId')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  async getPatientCompliance(@Param('patientId') patientId: string): Promise<ANCComplianceReport> {
    return this.ancService.getPatientANCCompliance(patientId);
  }

  /**
   * GET /anc/schedule/:patientId
   * Get ANC schedule recommendations for a patient
   */
  @Get('schedule/:patientId')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN, UserRole.PRENATAL)
  async getPatientSchedule(@Param('patientId') patientId: string) {
    return this.ancService.generateANCScheduleForPatient(patientId);
  }

  /**
   * GET /anc/statistics
   * Get ANC attendance statistics for analytics
   */
  @Get('statistics')
  @Roles(UserRole.DHO, UserRole.ADMIN)
  async getANCStatistics(@Query() filters: {
    district?: string;
    facilityName?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return this.ancService.getANCAttendanceStats(filters);
  }

  /**
   * GET /anc/poor-compliance
   * Get list of patients with poor ANC compliance
   */
  @Get('poor-compliance')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  async getPoorCompliancePatients(@Query('district') district?: string): Promise<ANCComplianceReport[]> {
    return this.ancService.getPatientsWithPoorCompliance(district);
  }
}