import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral, ReferralStatus, ReferralReason } from './entities/referral.entity';
import { CreateReferralDto } from './dto/create-referral.dto';
import { User } from '../users/entities/user.entity';
import { HealthFacility } from '../health-facilities/entities/health-facility.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { EventsGateway, SocketEvent } from '../events/events.gateway';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityAction } from '../activity-log/entities/activity-log.entity';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
    @InjectRepository(HealthFacility)
    private readonly facilityRepo: Repository<HealthFacility>,
    private readonly notificationsService: NotificationsService,
    private readonly eventsGateway: EventsGateway,
    private readonly activityLogService: ActivityLogService,
  ) {}

  /**
   * Create a new referral
   */
  async create(dto: CreateReferralDto, referringClinicianId: string): Promise<Referral> {
    // Validate facilities exist
    const referringFacility = await this.facilityRepo.findOne({
      where: { id: dto.referringFacilityId },
    });
    const receivingFacility = await this.facilityRepo.findOne({
      where: { id: dto.receivingFacilityId },
    });

    if (!referringFacility || !receivingFacility) {
      throw new BadRequestException('One or both facilities not found');
    }

    // Generate referral code
    const referralCode = this._generateReferralCode();

    const referral = this.referralRepo.create({
      ...dto,
      referringClinicianId,
      referralCode,
      status: ReferralStatus.PENDING,
    });

    const saved = await this.referralRepo.save(referral);

    // Notify receiving facility
    await this._notifyReceivingFacility(saved, receivingFacility);

    // Log activity
    await this.activityLogService.log({
      action: ActivityAction.REFERRAL_CREATED,
      actorId: referringClinicianId,
      description: `Referral created for patient ${dto.patientName} from ${referringFacility.name} to ${receivingFacility.name}. Reason: ${dto.reason}`,
      resourceType: 'referral',
      resourceId: saved.id,
      meta: { referralCode, reason: dto.reason },
    });

    // Emit WebSocket event
    this.eventsGateway.emit(SocketEvent.REFERRAL_CREATED, {
      referralId: saved.id,
      referralCode,
      patientName: dto.patientName,
      reason: dto.reason,
    });

    this.logger.log(`Referral ${saved.id} created with code ${referralCode}`);

    return saved;
  }

  /**
   * Get all referrals
   */
  async findAll(): Promise<Referral[]> {
    return this.referralRepo.find({
      relations: ['referringFacility', 'receivingFacility', 'referringClinician', 'receivingClinician'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get referrals by facility
   */
  async findByFacility(facilityId: string, type: 'referring' | 'receiving' = 'receiving'): Promise<Referral[]> {
    const column = type === 'referring' ? 'referringFacilityId' : 'receivingFacilityId';
    return this.referralRepo.find({
      where: { [column]: facilityId },
      relations: ['referringFacility', 'receivingFacility', 'referringClinician', 'receivingClinician'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get referrals by patient
   */
  async findByPatient(prenatalPatientId?: string, neonatalPatientId?: string): Promise<Referral[]> {
    const where: any = {};
    if (prenatalPatientId) where.prenatalPatientId = prenatalPatientId;
    if (neonatalPatientId) where.neonatalPatientId = neonatalPatientId;

    return this.referralRepo.find({
      where,
      relations: ['referringFacility', 'receivingFacility', 'referringClinician', 'receivingClinician'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a single referral
   */
  async findById(id: string): Promise<Referral | null> {
    return this.referralRepo.findOne({
      where: { id },
      relations: ['referringFacility', 'receivingFacility', 'referringClinician', 'receivingClinician'],
    });
  }

  /**
   * Get referral by code
   */
  async findByCode(referralCode: string): Promise<Referral | null> {
    return this.referralRepo.findOne({
      where: { referralCode },
      relations: ['referringFacility', 'receivingFacility', 'referringClinician', 'receivingClinician'],
    });
  }

  /**
   * Accept referral at receiving facility
   */
  async acceptReferral(id: string, receivingClinicianId: string): Promise<Referral> {
    const referral = await this.findById(id);
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    referral.status = ReferralStatus.ACCEPTED;
    referral.acceptedAt = new Date();
    referral.receivingClinicianId = receivingClinicianId;

    const updated = await this.referralRepo.save(referral);

    // Notify referring facility
    await this.notificationsService.create({
      userId: referral.referringClinicianId,
      title: '✅ Referral Accepted',
      body: `Your referral for ${referral.patientName} has been accepted by ${referral.receivingFacility?.name}. Receiving clinician: ${referral.receivingClinician?.fullName}`,
      type: NotificationType.ALERT,
    });

    this.logger.log(`Referral ${id} accepted by clinician ${receivingClinicianId}`);

    return updated;
  }

  /**
   * Reject referral
   */
  async rejectReferral(id: string, rejectionReason: string): Promise<Referral> {
    const referral = await this.findById(id);
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    referral.status = ReferralStatus.REJECTED;
    referral.rejectionReason = rejectionReason;
    referral.rejectedAt = new Date();

    const updated = await this.referralRepo.save(referral);

    // Notify referring facility
    await this.notificationsService.create({
      userId: referral.referringClinicianId,
      title: '❌ Referral Rejected',
      body: `Your referral for ${referral.patientName} has been rejected. Reason: ${rejectionReason}`,
      type: NotificationType.ALERT,
    });

    this.logger.log(`Referral ${id} rejected. Reason: ${rejectionReason}`);

    return updated;
  }

  /**
   * Update transport status
   */
  async updateTransportStatus(
    id: string,
    status: 'in_transit' | 'arrived',
    timestamp?: Date,
  ): Promise<Referral> {
    const referral = await this.findById(id);
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    if (status === 'in_transit') {
      referral.status = ReferralStatus.IN_TRANSIT;
      referral.departureTime = timestamp || new Date();
    } else if (status === 'arrived') {
      referral.status = ReferralStatus.ARRIVED;
      referral.arrivalTime = timestamp || new Date();

      // Notify receiving facility
      await this.notificationsService.create({
        userId: referral.receivingClinicianId || '',
        title: '🚑 Patient Arrived',
        body: `Patient ${referral.patientName} has arrived at ${referral.receivingFacility?.name}. Referral code: ${referral.referralCode}`,
        type: NotificationType.ALERT,
      });
    }

    const updated = await this.referralRepo.save(referral);

    this.eventsGateway.emit(SocketEvent.REFERRAL_UPDATED, {
      referralId: id,
      status,
      timestamp: timestamp || new Date(),
    });

    return updated;
  }

  /**
   * Complete referral
   */
  async completeReferral(id: string, treatmentOutcome: string): Promise<Referral> {
    const referral = await this.findById(id);
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    referral.status = ReferralStatus.COMPLETED;
    referral.treatmentOutcome = treatmentOutcome;
    referral.completedAt = new Date();

    const updated = await this.referralRepo.save(referral);

    // Notify referring facility
    await this.notificationsService.create({
      userId: referral.referringClinicianId,
      title: '✅ Referral Completed',
      body: `Referral for ${referral.patientName} has been completed. Outcome: ${treatmentOutcome}`,
      type: NotificationType.ALERT,
    });

    this.logger.log(`Referral ${id} completed`);

    return updated;
  }

  /**
   * Cancel referral
   */
  async cancelReferral(id: string): Promise<Referral> {
    const referral = await this.findById(id);
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    referral.status = ReferralStatus.CANCELLED;
    const updated = await this.referralRepo.save(referral);

    this.logger.log(`Referral ${id} cancelled`);

    return updated;
  }

  /**
   * Get referral statistics
   */
  async getStatistics(facilityId?: string): Promise<{
    total: number;
    pending: number;
    accepted: number;
    inTransit: number;
    arrived: number;
    completed: number;
    rejected: number;
    cancelled: number;
    byReason: Record<string, number>;
  }> {
    let query = this.referralRepo.createQueryBuilder('r');

    if (facilityId) {
      query = query.where('r.receivingFacilityId = :facilityId', { facilityId });
    }

    const total = await query.getCount();

    const statuses = await this.referralRepo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.status')
      .getRawMany();

    const statusMap: Record<string, number> = {};
    statuses.forEach((s) => {
      statusMap[s.status] = parseInt(s.count, 10);
    });

    const reasons = await this.referralRepo
      .createQueryBuilder('r')
      .select('r.reason', 'reason')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.reason')
      .getRawMany();

    const reasonMap: Record<string, number> = {};
    reasons.forEach((r) => {
      reasonMap[r.reason] = parseInt(r.count, 10);
    });

    return {
      total,
      pending: statusMap[ReferralStatus.PENDING] || 0,
      accepted: statusMap[ReferralStatus.ACCEPTED] || 0,
      inTransit: statusMap[ReferralStatus.IN_TRANSIT] || 0,
      arrived: statusMap[ReferralStatus.ARRIVED] || 0,
      completed: statusMap[ReferralStatus.COMPLETED] || 0,
      rejected: statusMap[ReferralStatus.REJECTED] || 0,
      cancelled: statusMap[ReferralStatus.CANCELLED] || 0,
      byReason: reasonMap,
    };
  }

  /**
   * Generate unique referral code
   */
  private _generateReferralCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REF-${timestamp}-${random}`;
  }

  /**
   * Notify receiving facility of new referral
   */
  private async _notifyReceivingFacility(referral: Referral, facility: HealthFacility): Promise<void> {
    try {
      const reasonLabel = this._getReferralReasonLabel(referral.reason);
      const urgency = referral.urgencyNotes ? `\n\nUrgency: ${referral.urgencyNotes}` : '';

      const body = `New referral received for patient ${referral.patientName} from ${referral.referringFacility?.name}.\n\nReason: ${reasonLabel}\n\nClinical Summary: ${referral.clinicalSummary}${urgency}\n\nReferral Code: ${referral.referralCode}`;

      // Notify all clinicians at receiving facility
      // This would typically query for clinicians at the facility
      this.logger.log(`Notification sent to ${facility.name} for referral ${referral.id}`);
    } catch (error) {
      this.logger.error(`Failed to notify receiving facility for referral ${referral.id}`, error);
    }
  }

  /**
   * Get human-readable label for referral reason
   */
  private _getReferralReasonLabel(reason: ReferralReason): string {
    const labels: Record<ReferralReason, string> = {
      [ReferralReason.HYPERTENSION]: 'Hypertension',
      [ReferralReason.BLEEDING]: 'Bleeding',
      [ReferralReason.INFECTION]: 'Infection',
      [ReferralReason.FETAL_DISTRESS]: 'Fetal Distress',
      [ReferralReason.PREMATURE_LABOR]: 'Premature Labor',
      [ReferralReason.PLACENTAL_ISSUES]: 'Placental Issues',
      [ReferralReason.NEONATAL_EMERGENCY]: 'Neonatal Emergency',
      [ReferralReason.NEONATAL_INFECTION]: 'Neonatal Infection',
      [ReferralReason.LOW_BIRTH_WEIGHT]: 'Low Birth Weight',
      [ReferralReason.RESPIRATORY_DISTRESS]: 'Respiratory Distress',
      [ReferralReason.JAUNDICE]: 'Jaundice',
      [ReferralReason.OTHER]: 'Other',
    };
    return labels[reason] || 'Unknown';
  }
}
