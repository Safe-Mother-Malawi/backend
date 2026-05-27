import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  /**
   * Create a new referral
   * POST /referrals
   */
  @Post()
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateReferralDto, @CurrentUser() user: User) {
    return this.referralsService.create(dto, user.id);
  }

  /**
   * Get all referrals
   * GET /referrals
   */
  @Get()
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.referralsService.findAll();
  }

  /**
   * Get referrals by facility
   * GET /referrals/facility/:facilityId
   */
  @Get('facility/:facilityId')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findByFacility(
    @Param('facilityId') facilityId: string,
    @Query('type') type: 'referring' | 'receiving' = 'receiving',
  ) {
    return this.referralsService.findByFacility(facilityId, type);
  }

  /**
   * Get referrals by patient
   * GET /referrals/patient/:patientId
   */
  @Get('patient/:patientId')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN, UserRole.PRENATAL, UserRole.NEONATAL)
  @HttpCode(HttpStatus.OK)
  async findByPatient(@Param('patientId') patientId: string) {
    return this.referralsService.findByPatient(patientId, undefined);
  }

  /**
   * Get referral by code
   * GET /referrals/code/:referralCode
   */
  @Get('code/:referralCode')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findByCode(@Param('referralCode') referralCode: string) {
    return this.referralsService.findByCode(referralCode);
  }

  /**
   * Get referral statistics
   * GET /referrals/stats
   */
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.DHO)
  @HttpCode(HttpStatus.OK)
  async getStatistics(@Query('facilityId') facilityId?: string) {
    return this.referralsService.getStatistics(facilityId);
  }

  /**
   * Get a specific referral
   * GET /referrals/:id
   */
  @Get(':id')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string) {
    return this.referralsService.findById(id);
  }

  /**
   * Accept referral
   * PUT /referrals/:id/accept
   */
  @Put(':id/accept')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async acceptReferral(@Param('id') id: string, @CurrentUser() user: User) {
    return this.referralsService.acceptReferral(id, user.id);
  }

  /**
   * Reject referral
   * PUT /referrals/:id/reject
   */
  @Put(':id/reject')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async rejectReferral(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
  ) {
    return this.referralsService.rejectReferral(id, rejectionReason);
  }

  /**
   * Update transport status
   * PUT /referrals/:id/transport
   */
  @Put(':id/transport')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateTransportStatus(
    @Param('id') id: string,
    @Body() body: { status: 'in_transit' | 'arrived'; timestamp?: string },
  ) {
    return this.referralsService.updateTransportStatus(
      id,
      body.status,
      body.timestamp ? new Date(body.timestamp) : undefined,
    );
  }

  /**
   * Complete referral
   * PUT /referrals/:id/complete
   */
  @Put(':id/complete')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async completeReferral(
    @Param('id') id: string,
    @Body('treatmentOutcome') treatmentOutcome: string,
  ) {
    return this.referralsService.completeReferral(id, treatmentOutcome);
  }

  /**
   * Cancel referral
   * PUT /referrals/:id/cancel
   */
  @Put(':id/cancel')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async cancelReferral(@Param('id') id: string) {
    return this.referralsService.cancelReferral(id);
  }
}
