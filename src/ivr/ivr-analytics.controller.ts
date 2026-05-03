/**
 * IVR Analytics Controller
 *
 * Exposes IVR call log data for the DHO dashboard and analytics pages.
 * All endpoints require JWT auth. DHO/Admin/Clinician roles only.
 *
 * GET /api/v1/ivr/analytics/summary      — aggregate stats for a date range
 * GET /api/v1/ivr/analytics/calls        — paginated call log
 * GET /api/v1/ivr/analytics/calls/:id    — single call detail with full interaction log
 * GET /api/v1/ivr/analytics/patient/:id  — all calls for a specific patient
 * GET /api/v1/ivr/analytics/responses    — health check responses (for Question Responses tab)
 */
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { IvrCallLogService } from './ivr-call-log.service';
import { IvrCallStatus, IvrCallOutcome } from './entities/ivr-call-log.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DHO, UserRole.ADMIN, UserRole.CLINICIAN)
@Controller('ivr/analytics')
export class IvrAnalyticsController {
  constructor(private readonly callLogService: IvrCallLogService) {}

  /**
   * GET /api/v1/ivr/analytics/summary
   * Aggregate IVR stats for a date range.
   *
   * Query params:
   *   from  — ISO date string (default: 30 days ago)
   *   to    — ISO date string (default: now)
   */
  @Get('summary')
  async getSummary(
    @Query('from') fromStr?: string,
    @Query('to')   toStr?: string,
  ) {
    const to   = toStr   ? new Date(toStr)   : new Date();
    const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.callLogService.getSummary(from, to);
  }

  /**
   * GET /api/v1/ivr/analytics/calls
   * Filtered, paginated call log.
   *
   * Query params:
   *   from        — ISO date
   *   to          — ISO date
   *   patientType — prenatal | neonatal
   *   status      — in_progress | completed | abandoned | error
   *   outcome     — risk_assessment_completed | appointment_checked | ...
   *   district    — district name
   *   limit       — default 50
   *   offset      — default 0
   */
  @Get('calls')
  async getCalls(
    @Query('from')        fromStr?: string,
    @Query('to')          toStr?: string,
    @Query('patientType') patientType?: 'prenatal' | 'neonatal',
    @Query('status')      status?: IvrCallStatus,
    @Query('outcome')     outcome?: IvrCallOutcome,
    @Query('district')    district?: string,
  ) {
    const from = fromStr ? new Date(fromStr) : undefined;
    const to   = toStr   ? new Date(toStr)   : undefined;

    const calls = await this.callLogService.findAll({
      from,
      to,
      patientType,
      status,
      outcome,
      district,
    });

    return {
      total: calls.length,
      calls,
    };
  }

  /**
   * GET /api/v1/ivr/analytics/calls/:id
   * Full detail of a single call including every interaction step.
   */
  @Get('calls/:id')
  async getCall(@Param('id', ParseUUIDPipe) id: string) {
    return this.callLogService.findOne(id);
  }

  /**
   * GET /api/v1/ivr/analytics/patient/:patientId
   * All IVR calls made by a specific patient — for the patient detail page.
   */
  @Get('patient/:patientId')
  async getPatientCalls(@Param('patientId') patientId: string) {
    const calls = await this.callLogService.findByPatient(patientId);
    return { total: calls.length, calls };
  }

  /**
   * GET /api/v1/ivr/analytics/responses
   * Health check responses from IVR assessments.
   * Returns data formatted for the "Question Responses" tab in DHO dashboard.
   *
   * Query params:
   *   limit  — default 50
   *   offset — default 0
   */
  @Get('responses')
  async getResponses(
    @Query('limit')  limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    // Get all completed risk assessments
    const calls = await this.callLogService.findAll({
      outcome: IvrCallOutcome.RISK_COMPLETED,
    });

    // Transform to Question Responses format
    const responses = calls
      .filter((call) => call.riskScore !== null && call.riskLevel !== null)
      .map((call) => ({
        id: call.id,
        createdAt: call.startedAt,
        patientType: call.patientType || 'unknown',
        category: call.patientType === 'prenatal' ? 'Pregnancy Health' : 'Baby Health',
        riskLevel: call.riskLevel,
        riskScore: call.riskScore,
        score: call.riskScore,
        topSymptom: this.getTopSymptom(call),
        primarySymptom: this.getTopSymptom(call),
        risk: call.riskLevel,
        answers: call.interactions
          .filter((i) => i.answerLabel)
          .map((i) => ({
            question: i.questionText || i.menuKey,
            answer: i.answerLabel,
            score: i.answerScore,
          })),
        carePathway: call.carePathway,
        callerPhone: call.callerPhone,
        district: call.district,
      }))
      .slice(offset, offset + limit);

    return {
      total: calls.filter((c) => c.riskScore !== null).length,
      responses,
    };
  }

  /**
   * Extract the top symptom from interactions
   */
  private getTopSymptom(call: any): string {
    if (!call.interactions || call.interactions.length === 0) {
      return 'N/A';
    }

    // Find the first question with an answer
    const answered = call.interactions.find((i) => i.answerLabel);
    if (answered) {
      return answered.answerLabel;
    }

    return 'N/A';
  }
}
