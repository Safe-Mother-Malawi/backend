/**
 * IVR Controller — Twilio Voice webhook endpoints.
 *
 * ── Voice ────────────────────────────────────────────────────────────────────
 * POST /api/v1/ivr/twilio/voice
 *   Twilio POSTs application/x-www-form-urlencoded on every call event.
 *   Response: application/xml  (TwiML)
 *
 * POST /api/v1/ivr/twilio/status
 *   Twilio POSTs call status events (answered, completed, etc.)
 */
import {
  Controller,
  Post,
  Body,
  HttpCode,
  Logger,
  Get,
  Res,
  BadRequestException,
  UseGuards,
  Query,
  Inject,
  forwardRef,
} from '@nestjs/common';
import type { Response } from 'express';
import { TwilioIvrController } from './twilio-ivr.controller';
import { SmsInboxService } from './sms-inbox.service';
import { IvrSimulatorService } from './ivr-simulator.service';
import { IvrCallLogService } from './ivr-call-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SmsProcessingStatus } from './entities/sms-inbox.entity';
import { IvrCallStatus } from './entities/ivr-call-log.entity';

// ── Controller ────────────────────────────────────────────────────────────────

@Controller('ivr')
export class IvrController {
  private readonly logger = new Logger(IvrController.name);

  constructor(
    private readonly smsInboxService: SmsInboxService,
    private readonly simulatorService: IvrSimulatorService,
    private readonly callLogService: IvrCallLogService,
  ) {}

  // ── SMS Inbox ──────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/ivr/sms/fetch
   * Manually trigger a poll of the SMS inbox.
   * Protected — DHO/Admin only.
   */
  @Post('sms/fetch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DHO, UserRole.ADMIN)
  @HttpCode(200)
  async fetchSmsInbox(): Promise<{ fetched: number; processed: number }> {
    this.logger.log('Manual SMS inbox fetch triggered');
    return this.smsInboxService.fetchAndProcess();
  }

  /**
   * GET /api/v1/ivr/sms/inbox
   * View the SMS inbox — all inbound messages with processing status.
   * Protected — DHO/Admin/Clinician.
   */
  @Get('sms/inbox')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DHO, UserRole.ADMIN, UserRole.CLINICIAN)
  async getSmsInbox(
    @Query('from')   from?:   string,
    @Query('status') status?: SmsProcessingStatus,
    @Query('limit')  limit?:  string,
  ) {
    const messages = await this.smsInboxService.findAll({
      from,
      status,
      limit: limit ? parseInt(limit, 10) : 100,
    });
    return { total: messages.length, messages };
  }

  /**
   * GET /api/v1/ivr/sms/stats
   * SMS inbox statistics — total, processed, failed, breakdown by keyword.
   * Protected — DHO/Admin.
   */
  @Get('sms/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DHO, UserRole.ADMIN)
  getSmsStats() {
    return this.smsInboxService.getStats();
  }

  // ── Health ─────────────────────────────────────────────────────────────────

  /** GET /api/v1/ivr/health — liveness check */
  @Get('health')
  health(): { status: string; module: string } {
    return {
      status: 'ok',
      module: 'ivr',
    };
  }

  // ── Call History ────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/ivr/call-history
   * Fetch recent IVR call history with summaries
   * Query params:
   *   - limit: number of calls to return (default: 20)
   *   - offset: pagination offset (default: 0)
   *   - patientType: 'prenatal' | 'neonatal' (optional)
   *   - status: 'completed' | 'abandoned' (optional)
   */
  @Get('call-history')
  @HttpCode(200)
  async getCallHistory(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('patientType') patientType?: 'prenatal' | 'neonatal',
    @Query('status') status?: string,
  ) {
    const pageLimit = limit ? Math.min(parseInt(limit, 10), 100) : 20;
    const pageOffset = offset ? parseInt(offset, 10) : 0;

    // Map status string to enum
    let statusFilter: IvrCallStatus | undefined;
    if (status === 'completed') statusFilter = IvrCallStatus.COMPLETED;
    else if (status === 'abandoned') statusFilter = IvrCallStatus.ABANDONED;

    // Fetch calls
    const calls = await this.callLogService.findAll({
      patientType,
      status: statusFilter,
    });

    // Paginate
    const paginatedCalls = calls.slice(pageOffset, pageOffset + pageLimit);

    // Build summaries
    const summaries = paginatedCalls.map((call) => ({
      id: call.id,
      sessionId: call.sessionId,
      callerPhone: call.callerPhone,
      patientName: call.patientName,
      patientType: call.patientType,
      district: call.district,
      healthCentre: call.healthCentre,
      startedAt: call.startedAt,
      endedAt: call.endedAt,
      durationSeconds: call.durationSeconds,
      status: call.status,
      outcome: call.outcome,
      riskScore: call.riskScore,
      riskLevel: call.riskLevel,
      carePathway: call.carePathway,
      interactionCount: call.interactions.length,
      lastInteraction: call.interactions.length > 0 
        ? call.interactions[call.interactions.length - 1].action 
        : null,
    }));

    return {
      total: calls.length,
      limit: pageLimit,
      offset: pageOffset,
      calls: summaries,
    };
  }

  /**
   * GET /api/v1/ivr/call-history/:id
   * Get detailed call transcript and interactions
   */
  @Get('call-history/:id')
  @HttpCode(200)
  async getCallDetail(@Query('id') id: string) {
    if (!id) {
      throw new BadRequestException('id is required');
    }
    const call = await this.callLogService.findOne(id);
    if (!call) {
      throw new BadRequestException('Call not found');
    }
    return call;
  }

  // ── IVR Simulator (Flutter App Integration) ────────────────────────────────

  /**
   * GET /api/v1/ivr/languages
   * Get list of supported IVR languages
   */
  @Get('languages')
  @HttpCode(200)
  getSupportedLanguages() {
    return {
      languages: [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa' },
      ],
    };
  }

  /**
   * POST /api/v1/ivr/simulator/init
   * Initialize a new simulator session
   * Body: { 
   *   sessionId: string, 
   *   language?: 'en' | 'ny',
   *   phone?: string,
   *   district?: string,
   *   healthFacility?: string,
   *   patientName?: string
   * }
   */
  @Post('simulator/init')
  @HttpCode(200)
  initSimulatorSession(@Body() body: { 
    sessionId: string; 
    language?: string;
    phone?: string;
    district?: string;
    healthFacility?: string;
    patientName?: string;
  }) {
    if (!body.sessionId) {
      throw new BadRequestException('sessionId is required');
    }
    const session = this.simulatorService.initializeSession(
      body.sessionId,
      body.language as any,
      body.phone,
      body.district,
      body.healthFacility,
      body.patientName,
    );
    return {
      sessionId: session.sessionId,
      language: session.language,
      message: 'Welcome to SafeMother Health IVR. Press 1 to continue.',
      nextMenu: 'welcome',
    };
  }

  /**
   * POST /api/v1/ivr/simulator/digit
   * Process a digit input from the simulator
   * Body: { sessionId: string, digit: string }
   */
  @Post('simulator/digit')
  @HttpCode(200)
  async processSimulatorDigit(@Body() body: { sessionId: string; digit: string }) {
    if (!body.sessionId || !body.digit) {
      throw new BadRequestException('sessionId and digit are required');
    }

    const response = await this.simulatorService.processDigit(body.sessionId, body.digit);
    return {
      message: response.message,
      nextMenu: response.nextMenu,
      action: response.action,
      riskLevel: response.riskLevel,
      shouldHangup: response.shouldHangup,
    };
  }

  /**
   * GET /api/v1/ivr/simulator/summary/:sessionId
   * Get session summary and results
   */
  @Get('simulator/summary/:sessionId')
  @HttpCode(200)
  getSimulatorSummary(@Query('sessionId') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException('sessionId is required');
    }
    return this.simulatorService.getSessionSummary(sessionId);
  }

  /**
   * POST /api/v1/ivr/simulator/end
   * End a simulator session
   * Body: { sessionId: string }
   */
  @Post('simulator/end')
  @HttpCode(200)
  endSimulatorSession(@Body() body: { sessionId: string }) {
    if (!body.sessionId) {
      throw new BadRequestException('sessionId is required');
    }
    this.simulatorService.endSession(body.sessionId);
    return { message: 'Session ended', sessionId: body.sessionId };
  }
}
